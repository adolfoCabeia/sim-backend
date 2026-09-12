export declare const submeterDocumentoDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        consumes: string[];
        security: {
            bearerAuth: never[];
        }[];
        response: {
            201: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    data: {
                        type: string;
                        properties: {
                            id: {
                                type: string;
                                format: string;
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNomeOriginal: {
                                type: string;
                                nullable: boolean;
                                example: string;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            motivoRejeicao: {
                                type: string;
                                nullable: boolean;
                            };
                            criadoEm: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                };
            };
            400: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
        };
    };
};
export declare const listarPedidosPendentesDocs: {
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
                        example: boolean;
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
                                estado: {
                                    type: string;
                                    enum: string[];
                                };
                                documentoTipo: {
                                    type: string;
                                    nullable: boolean;
                                };
                                documentoNomeOriginal: {
                                    type: string;
                                    nullable: boolean;
                                    example: string;
                                };
                                documentoNumero: {
                                    type: string;
                                    nullable: boolean;
                                };
                                motivoRejeicao: {
                                    type: string;
                                    nullable: boolean;
                                };
                                criadoEm: {
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
export declare const obterPedidoDocs: {
    schema: {
        tags: string[];
        summary: string;
        security: {
            bearerAuth: never[];
        }[];
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
                        properties: {
                            id: {
                                type: string;
                                format: string;
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNomeOriginal: {
                                type: string;
                                nullable: boolean;
                                example: string;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            motivoRejeicao: {
                                type: string;
                                nullable: boolean;
                            };
                            criadoEm: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                };
            };
            404: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
        };
    };
};
export declare const obterUrlDocumentoDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
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
                        properties: {
                            url: {
                                type: string;
                            };
                        };
                    };
                };
            };
            404: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
            409: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
        };
    };
};
export declare const solicitarCorrecaoDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
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
        body: {
            type: string;
            required: string[];
            properties: {
                motivoRejeicao: {
                    type: string;
                    minLength: number;
                    maxLength: number;
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
                        properties: {
                            id: {
                                type: string;
                                format: string;
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNomeOriginal: {
                                type: string;
                                nullable: boolean;
                                example: string;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            motivoRejeicao: {
                                type: string;
                                nullable: boolean;
                            };
                            criadoEm: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                };
            };
            404: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
            409: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
        };
    };
};
export declare const rejeitarDefinitivamenteDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
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
        body: {
            type: string;
            required: string[];
            properties: {
                motivoRejeicao: {
                    type: string;
                    minLength: number;
                    maxLength: number;
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
                        properties: {
                            id: {
                                type: string;
                                format: string;
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNomeOriginal: {
                                type: string;
                                nullable: boolean;
                                example: string;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            motivoRejeicao: {
                                type: string;
                                nullable: boolean;
                            };
                            criadoEm: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                };
            };
            404: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
            409: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
        };
    };
};
export declare const aprovarNivel1Docs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
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
                        properties: {
                            id: {
                                type: string;
                                format: string;
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNomeOriginal: {
                                type: string;
                                nullable: boolean;
                                example: string;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            motivoRejeicao: {
                                type: string;
                                nullable: boolean;
                            };
                            criadoEm: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                };
            };
            403: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
            404: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
            409: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
        };
    };
};
export declare const aprovarNivel2Docs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
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
                        properties: {
                            id: {
                                type: string;
                                format: string;
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNomeOriginal: {
                                type: string;
                                nullable: boolean;
                                example: string;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            motivoRejeicao: {
                                type: string;
                                nullable: boolean;
                            };
                            criadoEm: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                };
            };
            403: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
            404: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
            409: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=validation.docs.d.ts.map