import fp from "fastify-plugin";
import { Client } from "minio";

export const minioPlugin = fp(async (app) => {
  const minio = new Client({
    endPoint: "localhost",
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER!,
    secretKey: process.env.MINIO_ROOT_PASSWORD!,
  });

  app.decorate("minio", minio);
});