import { api } from 'src/boot/axios';
import type { InventoryCount } from 'src/interfaces/inventory-counts';
import { useInventoryCountsStore } from 'src/stores/inventory-counts';

export function useInventoryCountsResource() {
  const { setInventoryCounts } = useInventoryCountsStore();

  function findAll(params = {}) {
    return api.get('/inventory-counts', { params });
  }

  function findById(id: string) {
    return api.get(`/inventory-counts/${id}`);
  }

  function list(params = {}) {
    return api.get('/inventory-counts/list', { params });
  }

  function create(data: Partial<InventoryCount>) {
    return api.post('/inventory-counts', data);
  }

  function update(id: string, data: Partial<InventoryCount>) {
    return api.put(`/inventory-counts/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/inventory-counts/${id}`);
  }

  async function loadInventoryCounts(params = {}) {
    const { data } = await api.get('/inventory-counts/list', { params });
    setInventoryCounts(data);
  }

  return { findAll, findById, list, create, update, destroy, loadInventoryCounts };
}
