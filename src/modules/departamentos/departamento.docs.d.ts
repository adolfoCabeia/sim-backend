export declare const listarFuncionariosPorDepartamentoDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
        response: {
            200: {
                type: string;
                properties: {
                    success: {
                        type: string;
                    };
                    data: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                    format: string;
                                };
                                nome: {
                                    type: string;
                                };
                                direcao: {
                                    type: string;
                                    properties: {
                                        id: {
                                            type: string;
                                            format: string;
                                        };
                                        nome: {
                                            type: string;
                                        };
                                        sigla: {
                                            type: string;
                                        };
                                        municipio: {
                                            type: string;
                                            nullable: boolean;
                                            properties: {
                                                id: {
                                                    type: string;
                                                    format: string;
                                                };
                                                nome: {
                                                    type: string;
                                                };
                                                codigo: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                                utilizadores: {
                                    type: string;
                                    items: {
                                        type: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                            };
                                            nomeCompleto: {
                                                type: string;
                                            };
                                            email: {
                                                type: string;
                                            };
                                            tipoConta: {
                                                type: string;
                                            };
                                            estado: {
                                                type: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=departamento.docs.d.ts.map