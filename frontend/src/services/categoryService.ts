import { api } from './httpService';
import type { Category } from '../types/category';

const CATEGORIES_BASE_URL = '/categorias';

export const categoryService = {
  // List all categories
  list: async (): Promise<Category[]> => {
    return api.get<Category[]>(`${CATEGORIES_BASE_URL}/`);
  },

  // List categories by type (despesa or receita)
  listByType: async (tipo: 'despesa' | 'receita'): Promise<Category[]> => {
    return api.get<Category[]>(`${CATEGORIES_BASE_URL}/${tipo}`);
  },
};