-- AlterTable
ALTER TABLE "servicos" ADD COLUMN     "diasAlertaAntesPrazo" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "prazoDiasCorridos" INTEGER NOT NULL DEFAULT 15;
