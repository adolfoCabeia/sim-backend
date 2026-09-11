-- CreateTable
CREATE TABLE "processos_genericos_mensagens" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "lidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processos_genericos_mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processos_genericos_mensagens_processoId_lida_idx" ON "processos_genericos_mensagens"("processoId", "lida");

-- AddForeignKey
ALTER TABLE "processos_genericos_mensagens" ADD CONSTRAINT "processos_genericos_mensagens_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos_genericos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_genericos_mensagens" ADD CONSTRAINT "processos_genericos_mensagens_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "utilizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
