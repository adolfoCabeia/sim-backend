export declare function listarFuncionariosPorDepartamento(params: {
    executorId: string;
    executorMunicipioId: string;
}): Promise<{
    direcao: {
        sigla: string;
        id: string;
        nome: string;
    };
    utilizadores: {
        id: string;
        email: string;
        nomeCompleto: string;
        tipoConta: import("../../generated/prisma/index.js").$Enums.TipoConta;
        estado: import("../../generated/prisma/index.js").$Enums.EstadoUtilizador;
    }[];
    id: string;
    nome: string;
}[]>;
//# sourceMappingURL=departamento.service.d.ts.map