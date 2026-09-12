import type { CriarAgendamentoInput, ConfirmarAgendamentoInput, CancelarAgendamentoInput, ListarAgendamentosQuery } from "./agendamento.schema.js";
/**
 * "Agendamento Digital: Sistema de marcação prévia para audiências com o
 * administrador ou assistentes sociais, evitando filas."
 *
 * Regra central: dois agendamentos do MESMO tipo (ADMINISTRADOR ou
 * ASSISTENTE_SOCIAL) não podem ter horários sobrepostos — é isso que
 * "evita filas" (não há dois cidadãos a aparecer para a mesma hora à
 * espera do mesmo atendimento). Não modela disponibilidade/agenda de
 * trabalho (horário de expediente, dias de folga, etc.) — fica como
 * melhoria futura; por agora, qualquer horário sem conflito é aceite.
 */
export declare class AgendamentoNaoEncontradoError extends Error {
}
export declare class ConflitoDeHorarioError extends Error {
}
export declare class AgendamentoEstadoInvalidoError extends Error {
}
export declare class DataInvalidaError extends Error {
}
export declare function criarAgendamento(params: {
    municipioId: string;
    utilizadorId: string;
    input: CriarAgendamentoInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoAgendamento;
    utilizadorId: string | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoAgendamento;
    motivo: string;
    dataHoraInicio: Date;
    processoGenericoId: string | null;
    atendidoPorId: string | null;
    dataHoraFim: Date;
    observacoes: string | null;
}>;
export declare function confirmarAgendamento(params: {
    municipioId: string;
    agendamentoId: string;
    executorId: string;
    input: ConfirmarAgendamentoInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoAgendamento;
    utilizadorId: string | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoAgendamento;
    motivo: string;
    dataHoraInicio: Date;
    processoGenericoId: string | null;
    atendidoPorId: string | null;
    dataHoraFim: Date;
    observacoes: string | null;
}>;
export declare function cancelarAgendamento(params: {
    municipioId: string;
    agendamentoId: string;
    executorId: string;
    utilizadorSolicitanteId?: string;
    input: CancelarAgendamentoInput;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoAgendamento;
    utilizadorId: string | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoAgendamento;
    motivo: string;
    dataHoraInicio: Date;
    processoGenericoId: string | null;
    atendidoPorId: string | null;
    dataHoraFim: Date;
    observacoes: string | null;
}>;
export declare function marcarRealizado(params: {
    municipioId: string;
    agendamentoId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoAgendamento;
    utilizadorId: string | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoAgendamento;
    motivo: string;
    dataHoraInicio: Date;
    processoGenericoId: string | null;
    atendidoPorId: string | null;
    dataHoraFim: Date;
    observacoes: string | null;
}>;
export declare function marcarFalta(params: {
    municipioId: string;
    agendamentoId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoAgendamento;
    utilizadorId: string | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoAgendamento;
    motivo: string;
    dataHoraInicio: Date;
    processoGenericoId: string | null;
    atendidoPorId: string | null;
    dataHoraFim: Date;
    observacoes: string | null;
}>;
export declare function listarMeusAgendamentos(params: {
    municipioId: string;
    utilizadorId: string;
}): Promise<{
    id: string;
    criadoEm: Date;
    alteradoEm: Date;
    tipo: import("../../generated/prisma/index.js").$Enums.TipoAgendamento;
    utilizadorId: string | null;
    municipioId: string;
    estado: import("../../generated/prisma/index.js").$Enums.EstadoAgendamento;
    motivo: string;
    dataHoraInicio: Date;
    processoGenericoId: string | null;
    atendidoPorId: string | null;
    dataHoraFim: Date;
    observacoes: string | null;
}[]>;
export declare function listarAgendamentos(params: {
    municipioId: string;
    query: ListarAgendamentosQuery;
}): Promise<{
    items: {
        id: string;
        criadoEm: Date;
        alteradoEm: Date;
        tipo: import("../../generated/prisma/index.js").$Enums.TipoAgendamento;
        utilizadorId: string | null;
        municipioId: string;
        estado: import("../../generated/prisma/index.js").$Enums.EstadoAgendamento;
        motivo: string;
        dataHoraInicio: Date;
        processoGenericoId: string | null;
        atendidoPorId: string | null;
        dataHoraFim: Date;
        observacoes: string | null;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
//# sourceMappingURL=agendamento.service.d.ts.map