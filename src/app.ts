import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import compress from "@fastify/compress";
import { randomUUID } from "node:crypto";

import { env, isDevelopment } from "./config/env.js";
import { prisma } from "./config/prisma.js";

import { requestIdPlugin } from "./plugins/core/request-id.js";
import { errorHandlerPlugin } from "./plugins/core/error-handler.js";

import { jwtPlugin } from "./plugins/security/jwt.js";
import { authenticatePlugin } from "./plugins/security/authenticate.js";

import { loggerPlugin } from "./plugins/observability/logger.js";
import { metricsPlugin } from "./plugins/observability/metrics.js";
import { auditLoggingPlugin } from "./plugins/observability/audit-logging.js";

import swaggerPlugin from "./plugins/docs/swagger.js"

import { cookiePlugin } from "./plugins/cookies.js";
import { redisPlugin } from "./plugins/infra/redis.js";
import { bullPlugin } from "./plugins/infra/bullmq.js";
import { processEngineWorkerPlugin } from "./plugins/infra/process-engine-worker.js";
import { alertasOperacionaisWorkerPlugin } from "./plugins/infra/alertas-operacionais-worker.js";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { validationRoutes } from "./modules/auth/validate_identity/validation.routes.js";
import { usersRoutes } from "./modules/users/user.route.js"
import { municipiosRoutes } from "./modules/municipios/municipios.route.js";
import { processosGenericosRoutes } from "./modules/processos-genericos/processos-genericos.route.js";
import { departamentosRoutes } from "./modules/departamentos/departamento.route.js";
import { intercambiosRoutes } from "./modules/intercambios/intercambio.route.js";
import { pagamentosRoutes } from "./modules/pagamentos/pagamento.route.js";
import { agendamentosRoutes } from "./modules/agendamentos/agendamento.route.js";
import { notificacoesRoutes } from "./modules/notificacao/notificacao.route.js";
import { portalRoutes } from "./modules/portal/portal.route.js";
import { direcoesRoutes } from "./modules/direcoes/direcoes.routes.js";
import { conteudoPublicoRoutes } from "./modules/conteudo-publico/conteudo-publico.route.js";
import { contactosInstitucionaisRoutes } from "./modules/contactos/contacto.route.js";
import { logisticaRoutes } from "./modules/logistica/logistica.routes.js";
import { stockRoutes } from "./modules/stock/stock.routes.js";
import { patrimonioRoutes } from "./modules/patrimonios/patrimonio.routes.js";
import { rbacRoutes } from "./modules/auth/rbac/rbac.route.js";
import { servicosContinuosRoutes } from "./modules/servicos-continuos/servicos-continuos.routes.js";
import { manutencaoRoutes } from "./modules/manuntencao/manutencao.routes.js";
import { servicosRoutes } from "./modules/servicos/servico.route.js";
import { servicosDashboardRoutes } from "./modules/servicos/servico.dashboard.route.js";
import { funcionariosRoutes } from "./modules/rh/funcionarios/funcionario.route.js";
import { feriasRoutes } from "./modules/rh/ferias/ferias.route.js";
import { pontoRoutes } from "./modules/rh/ponto/ponto.route.js"; 
import { comissoesModeradoresRoutes } from "./modules/comissoes-moradores/comissao.route.js";
import { fiscalizacaoRoutes } from "./modules/fiscalizacao/fiscalizacao.route.js";
import { assinaturasRoutes } from "./modules/assinaturas/assinatura.route.js";
import { documentosRoutes } from "./modules/documentos/documento.route.js";
import { dashboardsRoutes } from "./modules/dashboards/dashboard.route.js";
import { bibliotecaJuridicaRoutes } from "./modules/biblioteca-juridica/biblioteca.route.js";
import { gepeRoutes } from "./modules/gepe/gepe.route.js";
import { ocorrenciasRoutes } from "./modules/ocorrencias/ocorrencias.routes.js";
import { frotaRoutes } from "./modules/frotas/frota.routes.js";
import { beneficiariosRoutes } from "./modules/acao-social/beneficiarios/beneficiario.route.js";
import { centrosRoutes } from "./modules/acao-social/centros/centro.route.js";
import { casosSensiveisRoutes } from "./modules/acao-social/casos-sensiveis/caso-sensivel.route.js";
import { programasRoutes } from "./modules/acao-social/programas/programa.route.js";
import { pedidosApoioRoutes } from "./modules/acao-social/pedidos-apoio/pedido-apoio.route.js";
import { distribuicaoKitRoutes } from "./modules/acao-social/distribuicao-kits/distribuicao-kit.route.js";
import { indicadoresRoutes } from "./modules/acao-social/indicadores/indicadores.route.js";
import { auditoriaRoutes } from "./modules/auditoria/auditoria.route.js";
import { receitasRoutes } from "./modules/receitas/receita.route.js";

import { socketPlugin } from "./plugins/realtime/sockets.js"; 
import alertasOperacionaisScheduler from "./plugins/scheduler/alertas-operacionais.scheduler.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
    genReqId: () => randomUUID(),
    pluginTimeout: 30_000,
    ajv: {
      customOptions: {
        strict: false,
      },
    },
  });

  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);

  await app.register(loggerPlugin);
  await app.register(auditLoggingPlugin);

  await app.register(helmet, {
    contentSecurityPolicy: isDevelopment ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  });

 
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
  });
  await app.register(compress, { global: true });

await app.register(redisPlugin);
await app.register(socketPlugin);
await app.register(bullPlugin);

  await app.register(cors, {
    origin: isDevelopment ? true : (env.FRONTEND_URL ? [env.FRONTEND_URL] : []),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Total-Count"],
    maxAge: 86400,
  });

  await app.register(multipart, {
    limits: {
     fileSize: 7 * 1024 * 1024,
      files: 5,
    },
  });

  await app.register(cookiePlugin);
  await app.register(jwtPlugin);
  await app.register(authenticatePlugin);
  await app.register(alertasOperacionaisScheduler);

  await app.register(processEngineWorkerPlugin);
  await app.register(alertasOperacionaisWorkerPlugin);
  await app.register(metricsPlugin);
  await app.register(swaggerPlugin);
  await app.register(authRoutes);
await app.register(rbacRoutes, { prefix: "/rbac" });
  await app.register(auditoriaRoutes);
  await app.register(validationRoutes);
  await app.register(usersRoutes);
  await app.register(municipiosRoutes);
  await app.register(processosGenericosRoutes);
  await app.register(departamentosRoutes);
  await app.register(intercambiosRoutes);
  await app.register(pagamentosRoutes);
  await app.register(agendamentosRoutes);
  await app.register(notificacoesRoutes);
  await app.register(portalRoutes);
  await app.register(conteudoPublicoRoutes);
  await app.register(contactosInstitucionaisRoutes);
  await app.register(logisticaRoutes, { prefix: "/logistica" })
  await app.register(stockRoutes, { prefix: "/stock" })
  await app.register(patrimonioRoutes, { prefix: "/patrimonio" })
  await app.register(manutencaoRoutes)
  await app.register(funcionariosRoutes)
  await app.register(feriasRoutes)
  await app.register(pontoRoutes)
  await app.register(comissoesModeradoresRoutes)
  await app.register(fiscalizacaoRoutes)
  await app.register(assinaturasRoutes)
  await app.register(documentosRoutes)
  await app.register(dashboardsRoutes)
  await app.register(bibliotecaJuridicaRoutes)
  await app.register(gepeRoutes)
  await app.register(ocorrenciasRoutes)
  await app.register(frotaRoutes)
  await app.register(direcoesRoutes);
  await app.register(servicosContinuosRoutes)
  await app.register(beneficiariosRoutes)
  await app.register(centrosRoutes)
  await app.register(casosSensiveisRoutes)
  await app.register(programasRoutes)
  await app.register(pedidosApoioRoutes)
  await app.register(distribuicaoKitRoutes)
  await app.register(indicadoresRoutes)
  await app.register(receitasRoutes)
  await app.register(servicosRoutes)
  await app.register(servicosDashboardRoutes)

  app.get(
    "/health",
    // Isento de rate limit — ver nota junto ao registo do plugin em cima.
    { config: { rateLimit: false } },
    async (_, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;

        return reply.send({
          status: "ok",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        app.log.error(
          { error },
          "Healthcheck falhou"
        );

        return reply.status(503).send({
          status: "error",
          reason: "database_unreachable",
        });
      }
    }
  );
  app.get("/", async () => {
    return {
      name: "SIM-VIANA API",
      version: "0.1.0",
      status: "Rodando",
    };
  });

  return app;
}