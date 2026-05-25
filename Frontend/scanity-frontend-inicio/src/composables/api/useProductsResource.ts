import { api } from 'src/boot/axios';
import type { Product } from 'src/interfaces/products';
import { useProductsStore } from 'src/stores/products';

export function useProductsResource() {
  const { setProducts } = useProductsStore();

  function findAll(params = {}) {
    return api.get('/products', { params });
  }

  function findById(id: string) {
    return api.get(`/products/${id}`);
  }

  function getThumbnailUrl(id: string) {
    return api.get<{ url: string | null }>(`/products/${id}/thumbnail/url`);
  }

  function uploadThumbnail(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/products/${id}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  function deleteThumbnail(id: string) {
    return api.delete(`/products/${id}/thumbnail`);
  }

  function list(params = {}) {
    return api.get('/products/list', { params });
  }

  function create(data: Partial<Product>) {
    return api.post('/products', data);
  }

  function update(id: string, data: Partial<Product>) {
    return api.put(`/products/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/products/${id}`);
  }

  async function loadProducts(params = {}) {
    const { data } = await api.get('/products/list', { params });
    setProducts(data);
  }

  return {
    findAll,
    findById,
    list,
    create,
    update,
    destroy,
    loadProducts,
    getThumbnailUrl,
    uploadThumbnail,
    deleteThumbnail,
  };
}
