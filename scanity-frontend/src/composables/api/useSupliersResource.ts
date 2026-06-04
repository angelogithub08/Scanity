import { api } from 'src/boot/axios';
import type { Suplier } from 'src/interfaces/supliers';
import { useSupliersStore } from 'src/stores/supliers';

export function useSupliersResource() {
  const { setSupliers } = useSupliersStore();

  function findAll(params = {}) {
    return api.get('/supliers', { params });
  }

  function findById(id: string) {
    return api.get(`/supliers/${id}`);
  }

  function list(params = {}) {
    return api.get('/supliers/list', { params });
  }

  function create(data: Partial<Suplier>) {
    return api.post('/supliers', data);
  }

  function update(id: string, data: Partial<Suplier>) {
    return api.put(`/supliers/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/supliers/${id}`);
  }

  async function loadSupliers(params = {}) {
    const { data } = await api.get('/supliers/list', { params });
    setSupliers(data);
  }

  return { findAll, findById, list, create, update, destroy, loadSupliers };
}
