export declare const listarMunicipiosDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
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
                                };
                                provincia: {
                                    type: string;
                                    nullable: boolean;
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
        description: string;
        params: {
            type: string;
            required: string[];
            properties: {
                id: {
                    type: string;
                    format: string;
                };
            };
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
                                    enum: string[];
                                };
                                areaResponsabilidade: {
                                    type: string;
                                    nullable: boolean;
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
        description: string;
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
                    example: string;
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
                    example: string;
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
                            municipio: {
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
                                    };
                                    provincia: {
                                        type: string;
                                        nullable: boolean;
                                    };
                                };
                            };
                            direcoesCriadas: {
                                type: string;
                                example: number;
                            };
                            departamentosCriados: {
                                type: string;
                                example: number;
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
//# sourceMappingURL=municipios.docs.d.ts.map