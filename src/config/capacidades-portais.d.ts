import type { CategoriaPortal } from "./catalogo-servicos.js";
export interface FuncionalidadePortal {
    codigo: string;
    nome: string;
    descricao: string;
    metodo: "GET" | "POST";
    endpoint: string;
    /** Códigos do catálogo (catalogo-servicos.ts) que instanciam esta funcionalidade, quando aplicável. */
    servicosCatalogoRelacionados?: string[];
}
export interface CapacidadesPortal {
    portal: CategoriaPortal;
    nome: string;
    tipoConta: string;
    autenticacao: string;
    descricao: string;
    funcionalidades: FuncionalidadePortal[];
}
export declare const CAPACIDADES_PORTAIS: CapacidadesPortal[];
export declare function obterCapacidadesPorTipoConta(tipoConta: string): CapacidadesPortal | undefined;
//# sourceMappingURL=capacidades-portais.d.ts.map