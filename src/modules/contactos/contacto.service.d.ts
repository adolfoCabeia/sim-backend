import type { CriarContactoInput, EditarContactoInput, ListarContactosQuery, ListarContactosPublicoQuery } from "./contacto.schema.js";
/**
 * Portal Administrativo (secção 16.2) — "Gestão de Contactos Institucionais
 * (registo de contactos telefónicos e e-mails, directório institucional,
 * comunicação entre utilizadores e instituições)."
 */
export declare class ContactoNaoEncontradoError extends Error {
}
export declare class DirecaoNaoEncontradaError extends Error {
}
export declare function criarContacto(params: {
    municipioId: string;
    executorId: string;
    input: CriarContactoInput;
}): Promise<{
    id: string;
    nome: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoContactoInstitucional;
    email: string | null;
    municipioId: string;
    telefone: string | null;
    endereco: string | null;
    direcaoId: string | null;
    criadoPorId: string | null;
    cargo: string | null;
    instituicao: string | null;
    notas: string | null;
    visivelPublico: boolean;
}>;
export declare function editarContacto(params: {
    municipioId: string;
    contactoId: string;
    input: EditarContactoInput;
}): Promise<{
    id: string;
    nome: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoContactoInstitucional;
    email: string | null;
    municipioId: string;
    telefone: string | null;
    endereco: string | null;
    direcaoId: string | null;
    criadoPorId: string | null;
    cargo: string | null;
    instituicao: string | null;
    notas: string | null;
    visivelPublico: boolean;
}>;
export declare function eliminarContacto(params: {
    municipioId: string;
    contactoId: string;
}): Promise<void>;
export declare function listarContactosAdmin(params: {
    municipioId: string;
    query: ListarContactosQuery;
}): Promise<{
    items: ({
        direcao: {
            sigla: string;
            id: string;
            nome: string;
        } | null;
    } & {
        id: string;
        nome: string;
        criadoEm: Date;
        alteradoEm: Date;
        tipo: import("../../generated/prisma/index.js").$Enums.TipoContactoInstitucional;
        email: string | null;
        municipioId: string;
        telefone: string | null;
        endereco: string | null;
        direcaoId: string | null;
        criadoPorId: string | null;
        cargo: string | null;
        instituicao: string | null;
        notas: string | null;
        visivelPublico: boolean;
    })[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
/** Directório público — só os contactos marcados como `visivelPublico: true`. */
export declare function listarContactosPublico(params: {
    municipioId: string;
    query: ListarContactosPublicoQuery;
}): Promise<{
    items: {
        direcao: {
            sigla: string;
            nome: string;
        } | null;
        id: string;
        nome: string;
        tipo: import("../../generated/prisma/index.js").$Enums.TipoContactoInstitucional;
        email: string | null;
        telefone: string | null;
        endereco: string | null;
        cargo: string | null;
        instituicao: string | null;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
//# sourceMappingURL=contacto.service.d.ts.map