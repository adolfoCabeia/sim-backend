import type { EnviarIntercambioInput, ListarIntercambiosQuery } from "./intercambio.schema.js";
/**
 * Módulo de Intercâmbio inter-municipal (Gabinete Jurídico, Intercâmbio e
 * Apoio às Comissões de Moradores — sigla GJ — e Gabinete do Administrador
 * — sigla GAM, marcado com `permiteIntercambioInterMunicipal: true` em
 * src/config/organograma.ts).
 *
 * ANTES DESTA CORRECÇÃO: o modelo `Intercambio` existia no schema (com
 * `direcaoOrigemId`, `municipioDestinoId`, `numeroProtocolo`, `estado`)
 * e a flag `Direcao.permiteIntercambioInterMunicipal` já era seedada —
 * mas não existia NENHUM controller/service/rota. Não havia forma, via
 * API, de uma direcção comunicar com outro município.
 *
 * NOTA DE ARQUITECTURA: um `Intercambio` é, por definição, um registo que
 * pertence a DOIS municípios ao mesmo tempo (origem e destino) — o modelo
 * de RLS por `app.current_municipio_id` usado no resto do sistema (uma
 * única "coluna de tenant" por tabela) não representa bem isto. As
 * tabelas `intercambios` e `municipios` nunca tiveram RLS activo (ver
 * prisma/enable_rls.sql) — por isso as queries a essas duas usam o
 * cliente `prisma` normal. Já `utilizadores` e `direcoes` TÊM RLS
 * forçado; como aqui precisamos de ler o utilizador/direcção do executor
 * fora do contexto de tenant de uma única transacção (para decidir se ele
 * pode ou não enviar), usamos `prismaAuthBypass` (a ligação com o role
 * que ignora RLS — ver `SEED_DATABASE_URL`), tal como já acontecia em
 * `departamento.service.ts`. O controlo de acesso é feito explicitamente
 * no código abaixo, já que não há RLS a fazê-lo por nós.
 */
export declare class DirecaoSemPermissaoIntercambioError extends Error {
}
export declare class MunicipioDestinoInvalidoError extends Error {
}
export declare class IntercambioNaoEncontradoError extends Error {
}
export declare class IntercambioNaoPertenceAoMunicipioError extends Error {
}
export declare function enviarIntercambio(params: {
    municipioOrigemId: string;
    executorId: string;
    input: EnviarIntercambioInput;
}): Promise<{
    id: string;
    estado: string;
    assunto: string;
    direcaoOrigemId: string;
    documentoStorageKey: string | null;
    municipioDestinoId: string;
    numeroProtocolo: string;
    enviadoEm: Date;
    recebidoEm: Date | null;
    confirmadoEm: Date | null;
}>;
export declare function listarIntercambios(params: {
    municipioId: string;
    query: ListarIntercambiosQuery;
}): Promise<{
    items: ({
        direcaoOrigem: {
            sigla: string;
            municipio: {
                id: string;
                nome: string;
            };
            id: string;
            nome: string;
        };
        municipioDestino: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        estado: string;
        assunto: string;
        direcaoOrigemId: string;
        documentoStorageKey: string | null;
        municipioDestinoId: string;
        numeroProtocolo: string;
        enviadoEm: Date;
        recebidoEm: Date | null;
        confirmadoEm: Date | null;
    })[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
/** Só o município de DESTINO pode confirmar a recepção. */
export declare function confirmarRecepcaoIntercambio(params: {
    intercambioId: string;
    municipioId: string;
}): Promise<{
    id: string;
    estado: string;
    assunto: string;
    direcaoOrigemId: string;
    documentoStorageKey: string | null;
    municipioDestinoId: string;
    numeroProtocolo: string;
    enviadoEm: Date;
    recebidoEm: Date | null;
    confirmadoEm: Date | null;
}>;
//# sourceMappingURL=intercambio.service.d.ts.map