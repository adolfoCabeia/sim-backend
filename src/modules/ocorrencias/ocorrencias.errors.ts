export class OcorrenciaNaoEncontradaError extends Error {
  constructor(message: string = "Ocorrência não encontrada.") {
    super(message);
    this.name = "OcorrenciaNaoEncontradaError";
  }
}
export class ImagensLimiteExcedidoError extends Error {}