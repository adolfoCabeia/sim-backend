/*
  Warnings:

  - A unique constraint covering the columns `[directorId]` on the table `direcoes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "direcoes" ADD COLUMN     "directorId" TEXT;

-- AlterTable
ALTER TABLE "processos_genericos_anexos" ADD COLUMN     "assinadoEm" TIMESTAMP(3),
ADD COLUMN     "storageKeyAssinado" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "direcoes_directorId_key" ON "direcoes"("directorId");

-- AddForeignKey
ALTER TABLE "direcoes" ADD CONSTRAINT "direcoes_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
