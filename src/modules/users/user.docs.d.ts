export declare const listarUtilizadoresDocs: {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
        querystring: {
            type: string;
            properties: {
                page: {
                    type: string;
                    minimum: number;
                    default: number;
                };
                pageSize: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    default: number;
                };
                estado: {
                    type: string;
                    enum: string[];
                };
                tipoConta: {
                    type: string;
                    enum: string[];
                };
                q: {
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
                    data: {
                        type: string;
                        properties: {
                            items: {
                                type: string;
                                items: {
                                    type: string;
                                    properties: {
                                        id: {
                                            type: string;
                                            format: string;
                                        };
                                        municipioId: {
                                            type: string;
                                            format: string;
                                        };
                                        direcaoId: {
                                            type: string;
                                            format: string;
                                            nullable: boolean;
                                        };
                                        nomeCompleto: {
                                            type: string;
                                            example: string;
                                        };
                                        email: {
                                            type: string;
                                            format: string;
                                        };
                                        tipoConta: {
                                            type: string;
                                            enum: string[];
                                        };
                                        estado: {
                                            type: string;
                                            enum: string[];
                                        };
                                        mfaActivo: {
                                            type: string;
                                        };
                                        emailConfirmado: {
                                            type: string;
                                        };
                                        documentoTipo: {
                                            type: string;
                                            nullable: boolean;
                                        };
                                        documentoNumero: {
                                            type: string;
                                            nullable: boolean;
                                        };
                                        documentoValidadoEm: {
                                            type: string;
                                            format: string;
                                            nullable: boolean;
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
                            page: {
                                type: string;
                            };
                            pageSize: {
                                type: string;
                            };
                            total: {
                                type: string;
                            };
                            totalPages: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
};
export declare const obterUtilizadorDocs: {
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
                            municipioId: {
                                type: string;
                                format: string;
                            };
                            direcaoId: {
                                type: string;
                                format: string;
                                nullable: boolean;
                            };
                            nomeCompleto: {
                                type: string;
                                example: string;
                            };
                            email: {
                                type: string;
                                format: string;
                            };
                            tipoConta: {
                                type: string;
                                enum: string[];
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            mfaActivo: {
                                type: string;
                            };
                            emailConfirmado: {
                                type: string;
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoValidadoEm: {
                                type: string;
                                format: string;
                                nullable: boolean;
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
export declare const criarUtilizadorDocs: {
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
                nomeCompleto: {
                    type: string;
                    minLength: number;
                    maxLength: number;
                };
                email: {
                    type: string;
                    format: string;
                };
                password: {
                    type: string;
                    minLength: number;
                };
                tipoConta: {
                    type: string;
                    enum: string[];
                };
                direcaoSigla: {
                    type: string;
                    nullable: boolean;
                    description: string;
                    example: string;
                };
                estado: {
                    type: string;
                    enum: string[];
                    default: string;
                };
                municipioId: {
                    type: string;
                    format: string;
                    nullable: boolean;
                    description: string;
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
                            municipioId: {
                                type: string;
                                format: string;
                            };
                            direcaoId: {
                                type: string;
                                format: string;
                                nullable: boolean;
                            };
                            nomeCompleto: {
                                type: string;
                                example: string;
                            };
                            email: {
                                type: string;
                                format: string;
                            };
                            tipoConta: {
                                type: string;
                                enum: string[];
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            mfaActivo: {
                                type: string;
                            };
                            emailConfirmado: {
                                type: string;
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoValidadoEm: {
                                type: string;
                                format: string;
                                nullable: boolean;
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
export declare const editarUtilizadorDocs: {
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
            properties: {
                nomeCompleto: {
                    type: string;
                    minLength: number;
                    maxLength: number;
                };
                direcaoSigla: {
                    type: string;
                    nullable: boolean;
                    description: string;
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
                    };
                    data: {
                        type: string;
                        properties: {
                            id: {
                                type: string;
                                format: string;
                            };
                            municipioId: {
                                type: string;
                                format: string;
                            };
                            direcaoId: {
                                type: string;
                                format: string;
                                nullable: boolean;
                            };
                            nomeCompleto: {
                                type: string;
                                example: string;
                            };
                            email: {
                                type: string;
                                format: string;
                            };
                            tipoConta: {
                                type: string;
                                enum: string[];
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            mfaActivo: {
                                type: string;
                            };
                            emailConfirmado: {
                                type: string;
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoValidadoEm: {
                                type: string;
                                format: string;
                                nullable: boolean;
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
export declare const alterarEstadoDocs: {
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
                estado: {
                    type: string;
                    enum: string[];
                };
                motivo: {
                    type: string;
                    minLength: number;
                    maxLength: number;
                    nullable: boolean;
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
                            municipioId: {
                                type: string;
                                format: string;
                            };
                            direcaoId: {
                                type: string;
                                format: string;
                                nullable: boolean;
                            };
                            nomeCompleto: {
                                type: string;
                                example: string;
                            };
                            email: {
                                type: string;
                                format: string;
                            };
                            tipoConta: {
                                type: string;
                                enum: string[];
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            mfaActivo: {
                                type: string;
                            };
                            emailConfirmado: {
                                type: string;
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoValidadoEm: {
                                type: string;
                                format: string;
                                nullable: boolean;
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
        };
    };
};
export declare const desactivarUtilizadorDocs: {
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
                            municipioId: {
                                type: string;
                                format: string;
                            };
                            direcaoId: {
                                type: string;
                                format: string;
                                nullable: boolean;
                            };
                            nomeCompleto: {
                                type: string;
                                example: string;
                            };
                            email: {
                                type: string;
                                format: string;
                            };
                            tipoConta: {
                                type: string;
                                enum: string[];
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            mfaActivo: {
                                type: string;
                            };
                            emailConfirmado: {
                                type: string;
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoValidadoEm: {
                                type: string;
                                format: string;
                                nullable: boolean;
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
        };
    };
};
export declare const redefinirPasswordDocs: {
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
                    message: {
                        type: string;
                    };
                    data: {
                        type: string;
                        properties: {
                            temporaryPassword: {
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
export declare const obterMeuPerfilDocs: {
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
                        allOf: ({
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                    format: string;
                                };
                                municipioId: {
                                    type: string;
                                    format: string;
                                };
                                direcaoId: {
                                    type: string;
                                    format: string;
                                    nullable: boolean;
                                };
                                nomeCompleto: {
                                    type: string;
                                    example: string;
                                };
                                email: {
                                    type: string;
                                    format: string;
                                };
                                tipoConta: {
                                    type: string;
                                    enum: string[];
                                };
                                estado: {
                                    type: string;
                                    enum: string[];
                                };
                                mfaActivo: {
                                    type: string;
                                };
                                emailConfirmado: {
                                    type: string;
                                };
                                documentoTipo: {
                                    type: string;
                                    nullable: boolean;
                                };
                                documentoNumero: {
                                    type: string;
                                    nullable: boolean;
                                };
                                documentoValidadoEm: {
                                    type: string;
                                    format: string;
                                    nullable: boolean;
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
                        } | {
                            type: string;
                            properties: {
                                perfis: {
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
                                                example: string;
                                            };
                                            descricao: {
                                                type: string;
                                                nullable: boolean;
                                            };
                                            sistemico: {
                                                type: string;
                                            };
                                        };
                                    };
                                };
                            };
                        })[];
                    };
                };
            };
        };
    };
};
export declare const editarMeuPerfilDocs: {
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
                nomeCompleto: {
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
                            municipioId: {
                                type: string;
                                format: string;
                            };
                            direcaoId: {
                                type: string;
                                format: string;
                                nullable: boolean;
                            };
                            nomeCompleto: {
                                type: string;
                                example: string;
                            };
                            email: {
                                type: string;
                                format: string;
                            };
                            tipoConta: {
                                type: string;
                                enum: string[];
                            };
                            estado: {
                                type: string;
                                enum: string[];
                            };
                            mfaActivo: {
                                type: string;
                            };
                            emailConfirmado: {
                                type: string;
                            };
                            documentoTipo: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoNumero: {
                                type: string;
                                nullable: boolean;
                            };
                            documentoValidadoEm: {
                                type: string;
                                format: string;
                                nullable: boolean;
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
export declare const changePasswordDocs: {
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
                passwordActual: {
                    type: string;
                };
                novaPassword: {
                    type: string;
                    minLength: number;
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
                };
            };
        };
    };
};
export declare const listarPerfisDoUtilizadorDocs: {
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
                        items: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                    format: string;
                                };
                                nome: {
                                    type: string;
                                    example: string;
                                };
                                descricao: {
                                    type: string;
                                    nullable: boolean;
                                };
                                sistemico: {
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
export declare const atribuirPerfilDocs: {
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
                perfilId: {
                    type: string;
                    format: string;
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
                    message: {
                        type: string;
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
                };
            };
        };
    };
};
export declare const revogarPerfilDocs: {
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
                perfilId: {
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
                        example: boolean;
                    };
                    message: {
                        type: string;
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
                };
            };
        };
    };
};
export declare const listarPerfisDisponiveisDocs: {
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
                                    example: string;
                                };
                                descricao: {
                                    type: string;
                                    nullable: boolean;
                                };
                                sistemico: {
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
export declare const listarPermissoesDisponiveisDocs: {
    schema: {
        tags: string[];
        summary: string;
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
                                recurso: {
                                    type: string;
                                    example: string;
                                };
                                accao: {
                                    type: string;
                                    example: string;
                                };
                                chave: {
                                    type: string;
                                    example: string;
                                };
                                descricao: {
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
//# sourceMappingURL=user.docs.d.ts.map