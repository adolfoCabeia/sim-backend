import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { isDevelopment } from "../../config/env.js";

export default fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "SIM-VIANA API",
        description:
          "Sistema Integrado Municipal de Viana — API backend. " +
          "Autenticação via Bearer token (JWT). Documentação gerada a partir " +
          "dos schemas de cada módulo.",
        version: "0.1.0",
        contact: {
          name: "Suporte SIM-VIANA",
          email: "suporte@simviana.gov.ao",
        },
      },
      servers: [
        {
          url: isDevelopment ? "http://localhost:3001" : "/",
          description: isDevelopment ? "Desenvolvimento" : "Produção",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Access token JWT obtido em POST /auth/login",
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: true,
  });
});