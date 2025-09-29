export interface Category {
  id: number;
  nome: string;
  tipo: "despesa" | "receita";
}

export interface CategoryCreate {
  nome: string;
  tipo: "despesa" | "receita";
}

export interface CategoryUpdate {
  nome: string;
}