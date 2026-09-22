/**
 * Adaptador de armazenamento para o módulo de assinaturas.
 *
 * >>> LIGA ESTAS DUAS FUNÇÕES AO STORAGE QUE JÁ USAS NOS ANEXOS <<<
 * (o mesmo que grava os ficheiros em `anexarDocumentoController` e os lê em `obterAnexoController`).
 * Não vi esse código, por isso ficam como pontos de ligação explícitos, sem adivinhar o teu storage.
 */

/** Lê o ficheiro guardado com esta `storageKey` (a mesma que está em ProcessoGenericoAnexo.storageKey). */
export async function lerFicheiro(_storageKey: string): Promise<Buffer> {
  // Exemplo (disco local):  return readFile(path.join(process.env.UPLOADS_DIR!, storageKey));
  // Exemplo (S3):           GetObjectCommand → Buffer.from(await resposta.Body!.transformToByteArray())
  throw new Error("assinatura.armazenamento.lerFicheiro: liga esta função ao storage dos anexos.");
}

/** Grava um ficheiro novo e devolve a `storageKey` com que passa a poder ser lido por `lerFicheiro`. */
export async function guardarFicheiro(_params: {
  nomeFicheiro: string;
  conteudo: Buffer;
  contentType: string;
}): Promise<string> {
  throw new Error("assinatura.armazenamento.guardarFicheiro: liga esta função ao storage dos anexos.");
}