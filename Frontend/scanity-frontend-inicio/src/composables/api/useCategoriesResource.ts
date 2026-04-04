import { api } from 'src/boot/axios';
import type { Category } from 'src/interfaces/categories';
import { useCategoriesStore } from 'src/stores/categories';

export function useCategoriesResource() {
  const { setCategories } = useCategoriesStore();

  function findAll(params = {}) {
    return api.get('/categories', { params });
  }

  function findById(id: string) {
    return api.get(`/categories/${id}`);
  }

  function list(params = {}) {
    return api.get('/categories/list', { params });
  }

  function create(data: Partial<Category>) {
    return api.post('/categories', data);
  }

  function update(id: string, data: Partial<Category>) {
    return api.put(`/categories/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/categories/${id}`);
  }

  async function loadCategories(params = {}) {
    const { data } = await api.get('/categories/list', { params });
    setCategories(data);
  }

  return { findAll, findById, list, create, update, destroy, loadCategories };
}
