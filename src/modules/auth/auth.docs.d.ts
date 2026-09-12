export declare const registerDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        body: {
            type: string;
            required: string[];
            properties: {
                municipioId: {
                    type: string;
                    format: string;
                };
                nomeCompleto: {
                    type: string;
                    minLength: number;
                    maxLength: number;
                    example: string;
                };
                email: {
                    type: string;
                    format: string;
                    example: string;
                };
                password: {
                    type: string;
                    minLength: number;
                    description: string;
                    example: string;
                };
                tipoConta: {
                    type: string;
                    enum: string[];
                    example: string;
                };
                direcaoId: {
                    type: string;
                    format: string;
                    nullable: boolean;
                };
            };
        };
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
                            email: {
                                type: string;
                                format: string;
                            };
                            estado: {
                                type: string;
                                enum: string[];
                                example: string;
                            };
                            emailConfirmado: {
                                type: string;
                                example: boolean;
                            };
                        };
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
                    code: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                };
            };
        };
    };
};
export declare const confirmEmailDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        body: {
            type: string;
            required: string[];
            properties: {
                token: {
                    type: string;
                    description: string;
                };
            };
        };
        response: {
            200: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                        example: string;
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
                    code: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                };
            };
        };
    };
};
export declare const loginDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        headers: {
            type: string;
            properties: {
                "x-client-type": {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
        };
        body: {
            type: string;
            required: string[];
            properties: {
                identificador: {
                    type: string;
                    minLength: number;
                    description: string;
                    example: string;
                };
                password: {
                    type: string;
                };
                mfaToken: {
                    type: string;
                    minLength: number;
                    maxLength: number;
                    nullable: boolean;
                    description: string;
                };
            };
        };
        response: {
            200: {
                type: string;
                description: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    data: {
                        type: string;
                        properties: {
                            utilizador: {
                                type: string;
                                properties: {
                                    id: {
                                        type: string;
                                        format: string;
                                    };
                                    nomeCompleto: {
                                        type: string;
                                        example: string;
                                    };
                                    email: {
                                        type: string;
                                        format: string;
                                        example: string;
                                    };
                                    municipioId: {
                                        type: string;
                                        format: string;
                                    };
                                    tipoConta: {
                                        type: string;
                                        enum: string[];
                                        example: string;
                                    };
                                    estado: {
                                        type: string;
                                        enum: string[];
                                        example: string;
                                    };
                                    mfaActivo: {
                                        type: string;
                                        example: boolean;
                                    };
                                };
                            };
                            accessToken: {
                                type: string;
                            };
                            refreshToken: {
                                type: string;
                                nullable: boolean;
                                description: string;
                            };
                        };
                    };
                };
            };
            401: {
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
                    code: {
                        type: string;
                        nullable: boolean;
                        example: string;
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
                    code: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                };
            };
            423: {
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
                    code: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                };
            };
        };
    };
};
export declare const refreshDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        body: {
            type: string;
            properties: {
                refreshToken: {
                    type: string;
                    nullable: boolean;
                    description: string;
                };
            };
        };
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
                        properties: {
                            accessToken: {
                                type: string;
                            };
                            refreshToken: {
                                type: string;
                                nullable: boolean;
                            };
                        };
                    };
                };
            };
            401: {
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
                    code: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                };
            };
        };
    };
};
export declare const logoutDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        body: {
            type: string;
            properties: {
                refreshToken: {
                    type: string;
                    nullable: boolean;
                    description: string;
                };
            };
        };
        response: {
            200: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                };
            };
        };
    };
};
export declare const initiateMfaDocs: {
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
                        properties: {
                            qrCodeDataUrl: {
                                type: string;
                                description: string;
                            };
                            secret: {
                                type: string;
                                description: string;
                            };
                        };
                    };
                };
            };
        };
    };
};
export declare const confirmMfaDocs: {
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
                token: {
                    type: string;
                    minLength: number;
                    maxLength: number;
                    example: string;
                };
            };
        };
        response: {
            200: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                        example: string;
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
                    code: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=auth.docs.d.ts.map