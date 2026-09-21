-- CreateEnum
CREATE TYPE "AlgoritmoAssinatura" AS ENUM ('ED25519', 'HMAC_LEGADO');

-- DropIndex
DROP INDEX "ChaveAssinaturaUtilizador_utilizadorId_key";

-- AlterTable
ALTER TABLE "AssinaturaEletronica" ADD COLUMN     "algoritmo" "AlgoritmoAssinatura" NOT NULL DEFAULT 'ED25519',
ADD COLUMN     "assinaturaHmac" TEXT,
ALTER COLUMN "assinaturaDigital" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ChaveAssinaturaUtilizador" ADD COLUMN     "revogadoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmissaoDocumento" ADD COLUMN     "origemLegado" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "conteudoSnapshot" DROP NOT NULL;

-- AlterTable
ALTER TABLE "processos_genericos" ADD COLUMN     "ultimoLembreteVezEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AlertaStock" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "itemStockId" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "ultimoEnviadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaServicoContinuo" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "servicoContinuoId" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "ultimoEnviadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaServicoContinuo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertaStock_municipioId_idx" ON "AlertaStock"("municipioId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertaStock_itemStockId_nivel_key" ON "AlertaStock"("itemStockId", "nivel");

-- CreateIndex
CREATE INDEX "AlertaServicoContinuo_municipioId_idx" ON "AlertaServicoContinuo"("municipioId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertaServicoContinuo_servicoContinuoId_nivel_key" ON "AlertaServicoContinuo"("servicoContinuoId", "nivel");

-- CreateIndex
CREATE INDEX "ChaveAssinaturaUtilizador_utilizadorId_revogadoEm_idx" ON "ChaveAssinaturaUtilizador"("utilizadorId", "revogadoEm");

-- CreateIndex
CREATE INDEX "ChaveAssinaturaUtilizador_utilizadorId_criadoEm_idx" ON "ChaveAssinaturaUtilizador"("utilizadorId", "criadoEm");
