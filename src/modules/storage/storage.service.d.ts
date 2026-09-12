export declare class TipoFicheiroInvalidoError extends Error {
}
export declare function detectarTipoReal(buffer: Buffer): string | null;
export declare function sanitizarNomeOriginal(nomeOriginal: string | undefined | null): string;
export interface UploadResult {
    storageKey: string;
    mimeType: string;
    tamanhoBytes: number;
    nomeOriginal: string;
}
export declare function uploadDocumento(params: {
    buffer: Buffer;
    prefixo: string;
    nomeOriginal?: string;
    mimeTiposAceites?: string[];
}): Promise<UploadResult>;
export declare const MIME_TIPOS_ENTRADA_SAIDA: string[];
export declare function obterNomeOriginal(storageKey: string): Promise<string>;
export declare function gerarUrlVisualizacao(storageKey: string, expiraEmSegundos?: number): Promise<string>;
export declare function eliminarDocumento(storageKey: string): Promise<void>;
//# sourceMappingURL=storage.service.d.ts.map