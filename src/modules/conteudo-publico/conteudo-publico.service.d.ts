import type { TipoConta } from "../../generated/prisma/client.js";
import type { CriarConteudoPublicoInput, EditarConteudoPublicoInput, PublicarConteudoPublicoInput, ListarConteudosPublicosQuery, ListarConteudosPublicosPublicoQuery } from "./conteudo-publico.schema.js";
export declare class ConteudoPublicoNaoEncontradoError extends Error {
}
export declare class ChaveJaExisteError extends Error {
}
export declare function criarConteudoPublico(params: {
    municipioId: string;
    executorId: string;
    input: CriarConteudoPublicoInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    chave: string;
    titulo: string;
    municipioId: string;
    criadoPorId: string | null;
    resumo: string | null;
    corpo: string;
    categoria: import("../../generated/prisma/index.js").$Enums.CategoriaConteudoPublico;
    estadoPublicacao: import("../../generated/prisma/index.js").$Enums.EstadoPublicacaoConteudo;
    gruposComAcesso: import("../../generated/prisma/index.js").$Enums.TipoConta[];
    publicadoPorId: string | null;
    publicadoEm: Date | null;
}>;
export declare function editarConteudoPublico(params: {
    municipioId: string;
    conteudoId: string;
    input: EditarConteudoPublicoInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    chave: string;
    titulo: string;
    municipioId: string;
    criadoPorId: string | null;
    resumo: string | null;
    corpo: string;
    categoria: import("../../generated/prisma/index.js").$Enums.CategoriaConteudoPublico;
    estadoPublicacao: import("../../generated/prisma/index.js").$Enums.EstadoPublicacaoConteudo;
    gruposComAcesso: import("../../generated/prisma/index.js").$Enums.TipoConta[];
    publicadoPorId: string | null;
    publicadoEm: Date | null;
}>;
export declare function publicarConteudoPublico(params: {
    municipioId: string;
    conteudoId: string;
    executorId: string;
    input: PublicarConteudoPublicoInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    chave: string;
    titulo: string;
    municipioId: string;
    criadoPorId: string | null;
    resumo: string | null;
    corpo: string;
    categoria: import("../../generated/prisma/index.js").$Enums.CategoriaConteudoPublico;
    estadoPublicacao: import("../../generated/prisma/index.js").$Enums.EstadoPublicacaoConteudo;
    gruposComAcesso: import("../../generated/prisma/index.js").$Enums.TipoConta[];
    publicadoPorId: string | null;
    publicadoEm: Date | null;
}>;
export declare function despublicarConteudoPublico(params: {
    municipioId: string;
    conteudoId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    chave: string;
    titulo: string;
    municipioId: string;
    criadoPorId: string | null;
    resumo: string | null;
    corpo: string;
    categoria: import("../../generated/prisma/index.js").$Enums.CategoriaConteudoPublico;
    estadoPublicacao: import("../../generated/prisma/index.js").$Enums.EstadoPublicacaoConteudo;
    gruposComAcesso: import("../../generated/prisma/index.js").$Enums.TipoConta[];
    publicadoPorId: string | null;
    publicadoEm: Date | null;
}>;
export declare function eliminarConteudoPublico(params: {
    municipioId: string;
    conteudoId: string;
}): Promise<void>;
export declare function listarConteudosPublicosAdmin(params: {
    municipioId: string;
    query: ListarConteudosPublicosQuery;
}): Promise<{
    items: {
        id: string;
        criadoEm: Date;
        alteradoEm: Date;
        chave: string;
        titulo: string;
        municipioId: string;
        criadoPorId: string | null;
        resumo: string | null;
        corpo: string;
        categoria: import("../../generated/prisma/index.js").$Enums.CategoriaConteudoPublico;
        estadoPublicacao: import("../../generated/prisma/index.js").$Enums.EstadoPublicacaoConteudo;
        gruposComAcesso: import("../../generated/prisma/index.js").$Enums.TipoConta[];
        publicadoPorId: string | null;
        publicadoEm: Date | null;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
export declare function obterConteudoPublicoAdmin(params: {
    municipioId: string;
    conteudoId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    chave: string;
    titulo: string;
    municipioId: string;
    criadoPorId: string | null;
    resumo: string | null;
    corpo: string;
    categoria: import("../../generated/prisma/index.js").$Enums.CategoriaConteudoPublico;
    estadoPublicacao: import("../../generated/prisma/index.js").$Enums.EstadoPublicacaoConteudo;
    gruposComAcesso: import("../../generated/prisma/index.js").$Enums.TipoConta[];
    publicadoPorId: string | null;
    publicadoEm: Date | null;
}>;
export declare function listarConteudosPublicos(params: {
    municipioId: string;
    query: ListarConteudosPublicosPublicoQuery;
}): Promise<{
    items: {
        id: string;
        chave: string;
        titulo: string;
        resumo: string | null;
        corpo: string;
        categoria: import("../../generated/prisma/index.js").$Enums.CategoriaConteudoPublico;
        estadoPublicacao: import("../../generated/prisma/index.js").$Enums.EstadoPublicacaoConteudo;
        publicadoEm: Date | null;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
export declare function obterConteudoPublicoPorChave(params: {
    municipioId: string;
    chave: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    chave: string;
    titulo: string;
    municipioId: string;
    criadoPorId: string | null;
    resumo: string | null;
    corpo: string;
    categoria: import("../../generated/prisma/index.js").$Enums.CategoriaConteudoPublico;
    estadoPublicacao: import("../../generated/prisma/index.js").$Enums.EstadoPublicacaoConteudo;
    gruposComAcesso: import("../../generated/prisma/index.js").$Enums.TipoConta[];
    publicadoPorId: string | null;
    publicadoEm: Date | null;
}>;
export declare function listarConteudosRestritosParaGrupo(params: {
    municipioId: string;
    tipoConta: TipoConta;
    query: ListarConteudosPublicosPublicoQuery;
}): Promise<{
    items: {
        id: string;
        criadoEm: Date;
        alteradoEm: Date;
        chave: string;
        titulo: string;
        municipioId: string;
        criadoPorId: string | null;
        resumo: string | null;
        corpo: string;
        categoria: import("../../generated/prisma/index.js").$Enums.CategoriaConteudoPublico;
        estadoPublicacao: import("../../generated/prisma/index.js").$Enums.EstadoPublicacaoConteudo;
        gruposComAcesso: import("../../generated/prisma/index.js").$Enums.TipoConta[];
        publicadoPorId: string | null;
        publicadoEm: Date | null;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
//# sourceMappingURL=conteudo-publico.service.d.ts.map