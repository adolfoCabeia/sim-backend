-- AlterTable
ALTER TABLE "agendamentos" ADD COLUMN     "chamadoPorId" TEXT;

-- AlterTable
ALTER TABLE "processos_genericos_mensagens" ADD COLUMN     "anexoMimeType" TEXT,
ADD COLUMN     "anexoNomeFicheiro" TEXT,
ADD COLUMN     "anexoStorageKey" TEXT,
ADD COLUMN     "anexoTamanhoBytes" INTEGER,
ALTER COLUMN "mensagem" DROP NOT NULL;

-- CreateTable
CREATE TABLE "contadores_senha" (
    "municipioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contadores_senha_pkey" PRIMARY KEY ("municipioId","tipo","dia")
);

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_chamadoPorId_fkey" FOREIGN KEY ("chamadoPorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
