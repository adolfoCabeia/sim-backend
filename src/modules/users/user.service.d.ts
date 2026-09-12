import type { Prisma } from "../../generated/prisma/client.js";
import type { ListarUtilizadoresQuery, CriarUtilizadorInput, EditarUtilizadorInput, EditarMeuPerfilInput, AlterarEstadoInput } from "./user.schema.js";
export declare class EmailJaExisteError extends Error {
}
export declare class UtilizadorNaoEncontradoError extends Error {
}
export declare class PasswordActualInvalidaError extends Error {
}
export declare class AutoSuspensaoError extends Error {
}
export declare class MunicipioDestinoNaoPermitidoError extends Error {
}
export declare class DirecaoNaoEncontradaError extends Error {
}
export declare class DepartamentoNaoEncontradoError extends Error {
}
export declare class DepartamentoSemDirecaoError extends Error {
}
export declare class SuperiorInvalidoError extends Error {
}
export declare class TipoContaNaoElegivelParaRedefinicaoError extends Error {
}
declare const SELECT_PUBLICO: {
    id: true;
    municipioId: true;
    direcaoId: true;
    departamentoId: true;
    superiorId: true;
    areaResponsabilidade: true;
    nomeCompleto: true;
    email: true;
    tipoConta: true;
    estado: true;
    mfaActivo: true;
    emailConfirmado: true;
    documentoTipo: true;
    documentoNumero: true;
    documentoValidadoEm: true;
    criadoEm: true;
    alteradoEm: true;
};
type UtilizadorPublico = Prisma.UtilizadorGetPayload<{
    select: typeof SELECT_PUBLICO;
}>;
export interface PaginatedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
export declare function listarUtilizadores(municipioId: string, query: ListarUtilizadoresQuery): Promise<PaginatedResult<UtilizadorPublico>>;
export declare function obterUtilizador(id: string, municipioId: string): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    areaResponsabilidade: import("../../generated/prisma/index.js").$Enums.AreaResponsabilidade | null;
    email: string;
    documentoNumero: string | null;
    municipioId: string;
    nomeCompleto: string;
    tipoConta: import("../../generated/prisma/index.js").$Enums.TipoConta;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoUtilizador;
    emailConfirmado: boolean;
    direcaoId: string | null;
    superiorId: string | null;
    departamentoId: string | null;
    documentoTipo: string | null;
    documentoValidadoEm: Date | null;
    mfaActivo: boolean;
}>;
export declare function criarUtilizador(params: {
    input: CriarUtilizadorInput;
    municipioId: string;
    executorId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    areaResponsabilidade: import("../../generated/prisma/index.js").$Enums.AreaResponsabilidade | null;
    email: string;
    documentoNumero: string | null;
    municipioId: string;
    nomeCompleto: string;
    tipoConta: import("../../generated/prisma/index.js").$Enums.TipoConta;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoUtilizador;
    emailConfirmado: boolean;
    direcaoId: string | null;
    superiorId: string | null;
    departamentoId: string | null;
    documentoTipo: string | null;
    documentoValidadoEm: Date | null;
    mfaActivo: boolean;
}>;
export declare function editarUtilizador(params: {
    id: string;
    input: EditarUtilizadorInput;
    municipioId: string;
    executorId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    areaResponsabilidade: import("../../generated/prisma/index.js").$Enums.AreaResponsabilidade | null;
    email: string;
    documentoNumero: string | null;
    municipioId: string;
    nomeCompleto: string;
    tipoConta: import("../../generated/prisma/index.js").$Enums.TipoConta;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoUtilizador;
    emailConfirmado: boolean;
    direcaoId: string | null;
    superiorId: string | null;
    departamentoId: string | null;
    documentoTipo: string | null;
    documentoValidadoEm: Date | null;
    mfaActivo: boolean;
}>;
export declare function editarMeuPerfil(params: {
    utilizadorId: string;
    municipioId: string;
    input: EditarMeuPerfilInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    areaResponsabilidade: import("../../generated/prisma/index.js").$Enums.AreaResponsabilidade | null;
    email: string;
    documentoNumero: string | null;
    municipioId: string;
    nomeCompleto: string;
    tipoConta: import("../../generated/prisma/index.js").$Enums.TipoConta;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoUtilizador;
    emailConfirmado: boolean;
    direcaoId: string | null;
    superiorId: string | null;
    departamentoId: string | null;
    documentoTipo: string | null;
    documentoValidadoEm: Date | null;
    mfaActivo: boolean;
}>;
export declare function alterarEstado(params: {
    id: string;
    input: AlterarEstadoInput;
    municipioId: string;
    executorId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    areaResponsabilidade: import("../../generated/prisma/index.js").$Enums.AreaResponsabilidade | null;
    email: string;
    documentoNumero: string | null;
    municipioId: string;
    nomeCompleto: string;
    tipoConta: import("../../generated/prisma/index.js").$Enums.TipoConta;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoUtilizador;
    emailConfirmado: boolean;
    direcaoId: string | null;
    superiorId: string | null;
    departamentoId: string | null;
    documentoTipo: string | null;
    documentoValidadoEm: Date | null;
    mfaActivo: boolean;
}>;
export declare function trocarPassword(params: {
    utilizadorId: string;
    municipioId: string;
    passwordActual: string;
    novaPassword: string;
}): Promise<void>;
export declare function redefinirPasswordUtilizador(params: {
    utilizadorId: string;
    municipioId: string;
    executorId: string;
}): Promise<{
    temporaryPassword: string;
}>;
export declare function atribuirPerfilAoUtilizador(params: {
    utilizadorId: string;
    perfilId: string;
    municipioId: string;
    executorId: string;
}): Promise<void>;
export declare function revogarPerfilDoUtilizador(params: {
    utilizadorId: string;
    perfilId: string;
    municipioId: string;
    executorId: string;
}): Promise<void>;
export {};
//# sourceMappingURL=user.service.d.ts.map