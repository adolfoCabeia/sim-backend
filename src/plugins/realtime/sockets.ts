import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { env, isDevelopment } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";

declare module "fastify" {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

let ioInstance: SocketIOServer | undefined;

export function getIO(): SocketIOServer | undefined {
  return ioInstance;
}

export const socketPlugin = fp(async (app: FastifyInstance) => {
  const io = new SocketIOServer(app.server, {
    path: "/socket.io",
    cors: {
      origin: isDevelopment ? true : env.FRONTEND_URL,
      credentials: false,
    },
  });
  const pubClient = new Redis(env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    connectTimeout: 10_000,
    retryStrategy: (times) => Math.min(times * 50, 5_000),
  });
  pubClient.on("error", (err) => {
    app.log.error({ err }, "[Socket.IO] Erro na ligação Redis (pubClient)");
  });

  const subClient = pubClient.duplicate();
  subClient.on("error", (err) => {
    app.log.error({ err }, "[Socket.IO] Erro na ligação Redis (subClient)");
  });

  io.adapter(createAdapter(pubClient, subClient));
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        next(new Error("NAO_AUTENTICADO"));
        return;
      }
      const payload = app.jwt.verify<{ sub: string; municipioId: string }>(
        token,
      );
      socket.data.utilizadorId = payload.sub;
      socket.data.municipioId = payload.municipioId;
      next();
    } catch {
      next(new Error("TOKEN_INVALIDO"));
    }
  });

  io.on("connection", (socket) => {
    const { utilizadorId, municipioId } = socket.data as {
      utilizadorId: string;
      municipioId: string;
    };
    socket.join(`utilizador:${utilizadorId}`);
    socket.join(`municipio:${municipioId}`);

    socket.on("ocorrencia:entrar", async ({ ocorrenciaId }: { ocorrenciaId: string }) => {
  try {
    const ocorrencia = await prisma.ocorrencia.findFirst({
      where: { id: ocorrenciaId, municipioId },
      select: { criadoPorId: true, responsavelId: true },
    });

    const autorizado =
      !!ocorrencia &&
      (ocorrencia.criadoPorId === utilizadorId || ocorrencia.responsavelId === utilizadorId);

    if (!autorizado) {
      socket.emit("ocorrencia:erro", { ocorrenciaId, message: "Sem acesso a esta conversa." });
      return;
    }

    socket.join(`ocorrencia:${ocorrenciaId}`);
  } catch {
    socket.emit("ocorrencia:erro", { ocorrenciaId, message: "Não foi possível entrar na conversa." });
  }
});

    socket.on(
      "ocorrencia:sair",
      ({ ocorrenciaId }: { ocorrenciaId: string }) => {
        socket.leave(`ocorrencia:${ocorrenciaId}`);
      },
    );

    socket.on(
      "ocorrencia:a-escrever",
      ({ ocorrenciaId }: { ocorrenciaId: string }) => {
        socket.to(`ocorrencia:${ocorrenciaId}`).emit("ocorrencia:a-escrever", {
          utilizadorId,
          timestamp: Date.now(),
        });
      },
    );

    socket.on("processo:entrar", async ({ processoId }: { processoId: string }) => {
      try {
        const processo = await prisma.processoGenerico.findFirst({
          where: { id: processoId, municipioId },
          select: { requerenteUtilizadorId: true, responsavelActualId: true },
        });

        const autorizado =
          !!processo &&
          (processo.requerenteUtilizadorId === utilizadorId || processo.responsavelActualId === utilizadorId);

        if (!autorizado) {
          socket.emit("processo:erro", { processoId, message: "Sem acesso a esta conversa." });
          return;
        }

        socket.join(`processo:${processoId}`);
      } catch {
        socket.emit("processo:erro", { processoId, message: "Não foi possível entrar na conversa." });
      }
    });

    socket.on("processo:sair", ({ processoId }: { processoId: string }) => {
      socket.leave(`processo:${processoId}`);
    });

    socket.on("processo:a-escrever", ({ processoId }: { processoId: string }) => {
      socket.to(`processo:${processoId}`).emit("processo:a-escrever", { utilizadorId, timestamp: Date.now() });
    });
  });

  ioInstance = io;
  app.decorate("io", io);

  app.addHook("onClose", async () => {
    ioInstance = undefined;
    io.close();
    await pubClient.quit();
    await subClient.quit();
  });
});
