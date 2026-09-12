import type { Prisma } from "../../../generated/prisma/client.js";
export declare class PermissaoInsuficienteError extends Error {
}
export declare class AutoEscaladaDePermissaoError extends Error {
}
export declare class PerfilSistemicoError extends Error {
}
export declare class PerfilNaoEncontradoError extends Error {
}
export declare class PermissaoJaExisteError extends Error {
}
export declare class PerfilJaExisteError extends Error {
}
export declare class SuperAdminSingularError extends Error {
}
export declare function hasPermission(utilizadorId: string, municipioId: string, permissaoChave: string): Promise<boolean>;
export declare function getPermissoesDoUtilizador(utilizadorId: string, municipioId: string): Promise<string[]>;
export declare function getPerfisDoUtilizador(utilizadorId: string, municipioId: string): Promise<{
    atribuidoEm: Date;
    id: string;
    nome: string;
    descricao: string | null;
    sistemico: boolean;
}[]>;
export declare function atribuirPerfil(params: {
    utilizadorId: string;
    perfilId: string;
    executorId: string;
    municipioId: string;
}): Promise<void>;
export declare function atribuirPerfilTx(tx: Prisma.TransactionClient, params: {
    utilizadorId: string;
    perfilId: string;
    executorId: string;
}): Promise<void>;
export declare function revogarPerfil(params: {
    utilizadorId: string;
    perfilId: string;
    executorId: string;
    municipioId: string;
}): Promise<void>;
export declare function listarPerfis(): Promise<({
    permissoes: ({
        permissao: {
            id: string;
            descricao: string | null;
            recurso: string;
            accao: string;
            chave: string;
        };
    } & {
        id: string;
        criadoEm: Date;
        perfilId: string;
        permissaoId: string;
    })[];
} & {
    id: string;
    nome: string;
    activo: boolean;
    criadoEm: Date;
    alteradoEm: Date;
    descricao: string | null;
    sistemico: boolean;
})[]>;
export declare function criarPerfil(params: {
    nome: string;
    descricao?: string;
}): Promise<{
    id: string;
    nome: string;
    activo: boolean;
    criadoEm: Date;
    alteradoEm: Date;
    descricao: string | null;
    sistemico: boolean;
}>;
export declare function desactivarPerfil(perfilId: string): Promise<void>;
export declare function criarPermissao(params: {
    recurso: string;
    accao: string;
    descricao?: string;
}): Promise<{
    id: string;
    descricao: string | null;
    recurso: string;
    accao: string;
    chave: string;
}>;
export declare function listarPermissoes(): Promise<{
    id: string;
    descricao: string | null;
    recurso: string;
    accao: string;
    chave: string;
}[]>;
export declare function associarPermissaoAoPerfil(params: {
    perfilId: string;
    permissaoId: string;
    executorId: string;
    municipioIdParaAuditoria: string;
}): Promise<void>;
export declare function desassociarPermissaoDoPerfil(params: {
    perfilId: string;
    permissaoId: string;
    executorId: string;
    municipioIdParaAuditoria: string;
}): Promise<void>;
//# sourceMappingURL=rbac.service.d.ts.map