/*
  Warnings:

  - You are about to drop the column `departamentoId` on the `Funcionario` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Funcionario_municipioId_departamentoId_idx";

-- AlterTable
ALTER TABLE "Funcionario" DROP COLUMN "departamentoId";

-- CreateIndex
CREATE INDEX "Funcionario_municipioId_idx" ON "Funcionario"("municipioId");

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
