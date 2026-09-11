/*
  Warnings:

  - Added the required column `mimeType` to the `OcorrenciaAnexo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storageKey` to the `OcorrenciaAnexo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tamanhoBytes` to the `OcorrenciaAnexo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificacaoTipo" ADD VALUE 'OCORRENCIA_MENSAGEM';
ALTER TYPE "NotificacaoTipo" ADD VALUE 'OCORRENCIA_ATUALIZADA';
ALTER TYPE "NotificacaoTipo" ADD VALUE 'OCORRENCIA_ATRIBUIDA';

-- AlterTable
ALTER TABLE "Ocorrencia" ADD COLUMN     "responsavelId" TEXT;

-- AlterTable
ALTER TABLE "OcorrenciaAnexo" ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "storageKey" TEXT NOT NULL,
ADD COLUMN     "tamanhoBytes" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OcorrenciaMensagem" ADD COLUMN     "lida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lidaEm" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Ocorrencia_responsavelId_idx" ON "Ocorrencia"("responsavelId");

-- CreateIndex
CREATE INDEX "OcorrenciaAnexo_ocorrenciaId_idx" ON "OcorrenciaAnexo"("ocorrenciaId");

-- CreateIndex
CREATE INDEX "OcorrenciaMensagem_ocorrenciaId_lida_idx" ON "OcorrenciaMensagem"("ocorrenciaId", "lida");

-- AddForeignKey
ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
