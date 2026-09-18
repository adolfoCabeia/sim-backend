import "dotenv/config";
import argon2 from "argon2";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Perfil, type Municipio } from "../src/generated/prisma/client.js";

const sslActivo = process.env.DATABASE_SSL !== undefined
  ? process.env.DATABASE_SSL === "true"
  : process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
  keepAlive: true,
  ssl: sslActivo ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("🔴 PostgreSQL Pool:", err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function withMunicipio<T>(
  municipioId: string,
  fn: (tx: any) => Promise<T>,
  tentativas = 3
): Promise<T> {
  for (let i = 1; i <= tentativas; i++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_municipio_id', ${municipioId}, true)`;
          return fn(tx);
        },
        { timeout: 300_000, maxWait: 30_000 }
      );
    } catch (err: any) {
      const transitorio = /Connection terminated|ECONNRESET|ETIMEDOUT/.test(String(err?.message));
      if (!transitorio || i === tentativas) throw err;
      console.warn(`   ⚠️  Ligação caiu (tentativa ${i}/${tentativas}), a repetir...`);
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
  throw new Error("unreachable");
}

const MUNICIPIO_VIANA = { nome: "Viana", codigo: "AO-LUA-VIANA", provincia: "Luanda" };

const PERFIL_SUPER_ADMIN = {
  nome: "SUPER_ADMIN",
  sistemico: true,
  descricao:
    "Administrador da Plataforma (técnico/sistema). Perfil SINGULAR: só pode existir UM utilizador com este perfil em todo o sistema (reforçado por índice único parcial — ver prisma/singleton_super_admin.sql — e por guarda em rbac.service.ts). É o único perfil que pode criar funcionários em qualquer município.",
};

// Apenas os recursos pedidos: Utilizadores, Perfis, Permissões
const PERMISSOES_DATA = [
  // Utilizadores
  { nome: "UTILIZADORES_CRIAR", recurso: "utilizadores", accao: "criar" },
  { nome: "UTILIZADORES_EDITAR", recurso: "utilizadores", accao: "editar" },
  { nome: "UTILIZADORES_DESACTIVAR", recurso: "utilizadores", accao: "desactivar" },
  { nome: "UTILIZADORES_ATRIBUIR_PERFIL", recurso: "utilizadores", accao: "atribuir_perfil" },
  { nome: "UTILIZADORES_REDEFINIR_PASSWORD", recurso: "utilizadores", accao: "redefinir_password" },

  // Perfis
  { nome: "GERIR_PERFIS", recurso: "perfis", accao: "gerir" },

  // Permissões (não existia no seed original — criado no mesmo estilo de GERIR_PERFIS)
  { nome: "GERIR_PERMISSOES", recurso: "permissoes", accao: "gerir" },
  { nome: "CONSULTAR_PERMISSOES", recurso: "permissoes", accao: "consultar" },
];

async function garantirMunicipioViana(): Promise<Municipio> {
  const municipio = await prisma.municipio.upsert({
    where: { codigo: MUNICIPIO_VIANA.codigo },
    update: MUNICIPIO_VIANA,
    create: { ...MUNICIPIO_VIANA },
  });
  console.log(`   ${municipio.nome} (${municipio.codigo})`);
  return municipio;
}

async function garantirPerfilSuperAdmin(): Promise<Perfil> {
  const perfil = await prisma.perfil.upsert({
    where: { nome: PERFIL_SUPER_ADMIN.nome },
    update: PERFIL_SUPER_ADMIN,
    create: { ...PERFIL_SUPER_ADMIN },
  });
  console.log(`   Perfil garantido: ${perfil.nome}`);
  return perfil;
}

async function garantirPermissoesEVinculo(perfilSuperAdmin: Perfil) {
  console.log("\nCriando Permissões (utilizadores, perfis, permissões)...");
  const permissoesCriadas: { nome: string; id: string }[] = [];

  for (const permData of PERMISSOES_DATA) {
    const { nome, ...dadosPermissao } = permData;
    const chave = `${dadosPermissao.recurso}:${dadosPermissao.accao}`;
    const perm = await prisma.permissao.upsert({
      where: { chave },
      update: dadosPermissao,
      create: { chave, ...dadosPermissao },
    });
    permissoesCriadas.push({ nome, id: perm.id });
    console.log(`   ${nome}`);
  }

  console.log("\nAtribuindo permissões ao SUPER_ADMIN...");
  for (const perm of permissoesCriadas) {
    await prisma.perfilPermissao.upsert({
      where: { perfilId_permissaoId: { perfilId: perfilSuperAdmin.id, permissaoId: perm.id } },
      update: {},
      create: { perfilId: perfilSuperAdmin.id, permissaoId: perm.id },
    });
  }
  console.log(`   ${permissoesCriadas.length} permissões vinculadas ao SUPER_ADMIN`);
}

async function main() {
  try {
    console.log("Iniciando seed do Município de Viana + SUPER_ADMIN...\n");

    console.log("Criando Município de Viana...");
    const municipioViana = await garantirMunicipioViana();

    console.log("\nGarantindo Perfil SUPER_ADMIN...");
    const perfilSuperAdmin = await garantirPerfilSuperAdmin();

    await garantirPermissoesEVinculo(perfilSuperAdmin);

    console.log("\nVerificando SUPER_ADMIN...");
    await withMunicipio(municipioViana.id, async (tx) => {
      const superAdminExistente = await tx.utilizadorPerfil.findFirst({
        where: { perfilId: perfilSuperAdmin.id },
      });

      if (superAdminExistente) {
        console.log("   Já existe um SUPER_ADMIN — a saltar (perfil é singular).");
        return;
      }

      const email = process.env.SEED_SUPER_ADMIN_EMAIL;
      const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
      if (!email || !password) {
        throw new Error(
          "SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD não definidas no .env — não é possível criar o SUPER_ADMIN."
        );
      }

      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });

      const superAdmin = await tx.utilizador.create({
        data: {
          municipioId: municipioViana.id,
          nomeCompleto: "Administrador da Plataforma",
          email,
          passwordHash,
          tipoConta: "INTERNO",
          estado: "ACTIVA",
          emailConfirmado: true,
        },
      });

      await tx.utilizadorPerfil.create({
        data: { utilizadorId: superAdmin.id, perfilId: perfilSuperAdmin.id },
      });

      console.log(`  ✅ SUPER_ADMIN criado: ${email} (muda a password no primeiro login)`);
    });

    console.log("\n Seed completada com sucesso!");
  } catch (error) {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();