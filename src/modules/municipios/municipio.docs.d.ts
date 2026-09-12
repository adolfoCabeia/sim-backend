export declare const listarMunicipiosDocs: {
    schema: {
        tags: string[];
        summary: string;
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
                                codigo: {
                                    type: string;
                                    example: string;
                                };
                                provincia: {
                                    type: string;
                                    nullable: boolean;
                                };
                                activo: {
                                    type: string;
                                };
                                criadoEm: {
                                    type: string;
                                    format: string;
                                };
                                alteradoEm: {
                                    type: string;
                                    format: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
};
export declare const listarDirecoesDoMunicipioDocs: {
    schema: {
        tags: string[];
        summary: string;
        params: {
            type: string;
            properties: {
                id: {
                    type: string;
                    format: string;
                };
            };
            required: string[];
        };
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
                                sigla: {
                                    type: string;
                                };
                                tipo: {
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
export declare const criarMunicipioDocs: {
    schema: {
        tags: string[];
        summary: string;
        security: {
            bearerAuth: never[];
        }[];
        body: {
            type: string;
            required: string[];
            properties: {
                nome: {
                    type: string;
                    minLength: number;
                    maxLength: number;
                };
                codigo: {
                    type: string;
                    minLength: number;
                    maxLength: number;
                    example: string;
                };
                provincia: {
                    type: string;
                    minLength: number;
                    maxLength: number;
                };
            };
        };
        response: {
            201: {
                type: string;
                properties: {
                    success: {
                        type: string;
                    };
                    data: {
                        type: string;
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
                                example: string;
                            };
                            provincia: {
                                type: string;
                                nullable: boolean;
                            };
                            activo: {
                                type: string;
                            };
                            criadoEm: {
                                type: string;
                                format: string;
                            };
                            alteradoEm: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                };
            };
            403: {
                type: string;
                properties: {
                    success: {
                        type: string;
                    };
                    message: {
                        type: string;
                    };
                };
            };
            409: {
                type: string;
                properties: {
                    success: {
                        type: string;
                    };
                    message: {
                        type: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=municipio.docs.d.ts.map