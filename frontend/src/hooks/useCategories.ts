import { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import type { Category } from '../types/category';

interface UseCategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

export const useCategories = (tipo?: 'despesa' | 'receita') => {
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        let categories: Category[];

        if (tipo) {
          categories = await categoryService.listByType(tipo);
        } else {
          categories = await categoryService.list();
        }

        setState({
          categories,
          loading: false,
          error: null,
        });
      } catch (error: any) {
        setState({
          categories: [],
          loading: false,
          error: error.response?.data?.detail || 'Erro ao carregar categorias',
        });
      }
    };

    fetchCategories();
  }, [tipo]);

  return state;
};