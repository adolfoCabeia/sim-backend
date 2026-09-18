/*
  Warnings:

  - You are about to drop the `assinaturas_eletronicas` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[utilizadorId]` on the table `comissoes_moradores` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `utilizadorId` to the `comissoes_moradores` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "comissoes_moradores" ADD COLUMN     "criadoPorUtilizadorId" TEXT,
ADD COLUMN     "utilizadorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "utilizadores" ADD COLUMN     "online" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ultimoIpLogin" TEXT,
ADD COLUMN     "ultimoLoginEm" TIMESTAMP(3),
ADD COLUMN     "ultimoLogoutEm" TIMESTAMP(3);

-- DropTable
DROP TABLE "assinaturas_eletronicas";

-- CreateTable
CREATE TABLE "ChaveAssinaturaUtilizador" (
    "id" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "chavePublica" TEXT NOT NULL,
    "chavePrivadaCifrada" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChaveAssinaturaUtilizador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissaoDocumento" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "referenciaTipo" TEXT NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "conteudoSnapshot" TEXT NOT NULL,
    "hashConteudo" TEXT NOT NULL,
    "codigoVerificacao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "substituidaPorId" TEXT,

    CONSTRAINT "EmissaoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssinaturaEletronica" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "emissaoId" TEXT NOT NULL,
    "signatarioId" TEXT NOT NULL,
    "tipoAssinatura" TEXT NOT NULL,
    "assinaturaDigital" TEXT NOT NULL,
    "ipOrigem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssinaturaEletronica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChaveAssinaturaUtilizador_utilizadorId_key" ON "ChaveAssinaturaUtilizador"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "EmissaoDocumento_codigoVerificacao_key" ON "EmissaoDocumento"("codigoVerificacao");

-- CreateIndex
CREATE UNIQUE INDEX "EmissaoDocumento_substituidaPorId_key" ON "EmissaoDocumento"("substituidaPorId");

-- CreateIndex
CREATE INDEX "EmissaoDocumento_municipioId_idx" ON "EmissaoDocumento"("municipioId");

-- CreateIndex
CREATE UNIQUE INDEX "EmissaoDocumento_referenciaTipo_referenciaId_versao_key" ON "EmissaoDocumento"("referenciaTipo", "referenciaId", "versao");

-- CreateIndex
CREATE INDEX "AssinaturaEletronica_emissaoId_idx" ON "AssinaturaEletronica"("emissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "comissoes_moradores_utilizadorId_key" ON "comissoes_moradores"("utilizadorId");

-- AddForeignKey
ALTER TABLE "EmissaoDocumento" ADD CONSTRAINT "EmissaoDocumento_substituidaPorId_fkey" FOREIGN KEY ("substituidaPorId") REFERENCES "EmissaoDocumento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaEletronica" ADD CONSTRAINT "AssinaturaEletronica_emissaoId_fkey" FOREIGN KEY ("emissaoId") REFERENCES "EmissaoDocumento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes_moradores" ADD CONSTRAINT "comissoes_moradores_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes_moradores" ADD CONSTRAINT "comissoes_moradores_criadoPorUtilizadorId_fkey" FOREIGN KEY ("criadoPorUtilizadorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
