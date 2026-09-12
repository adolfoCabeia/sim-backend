import type { Prisma } from "../../generated/prisma/client.js";
import type { CriarMunicipioInput } from "./municipios.schema.js";
export declare class CodigoMunicipioJaExisteError extends Error {
}
export declare class ApenasSuperAdminError extends Error {
}
export declare function provisionarUnidadesOrganicas(tx: Prisma.TransactionClient, municipioId: string): Promise<{
    direcoes: number;
    departamentos: number;
}>;
export declare function criarMunicipio(params: {
    input: CriarMunicipioInput;
    executorId: string;
    executorMunicipioId: string;
}): Promise<{
    municipio: {
        id: string;
        nome: string;
        codigo: string;
        provincia: string | null;
        activo: boolean;
        criadoEm: Date;
        alteradoEm: Date;
    };
    direcoesCriadas: number;
    departamentosCriados: number;
}>;
export declare function listarMunicipios(): Promise<{
    id: string;
    nome: string;
    codigo: string;
    provincia: string | null;
}[]>;
export declare function listarDirecoesDoMunicipio(municipioId: string): Promise<{
    sigla: string;
    id: string;
    nome: string;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoOrgao;
    areaResponsabilidade: import("../../generated/prisma/index.js").$Enums.AreaResponsabilidade | null;
}[]>;
//# sourceMappingURL=municipios.service.d.ts.map