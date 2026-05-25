import { api } from 'src/boot/axios';
import type { Customer } from 'src/interfaces/customers';
import { useCustomersStore } from 'src/stores/customers';

export function useCustomersResource() {
  const { setCustomers } = useCustomersStore();

  function findAll(params = {}) {
    return api.get('/customers', { params });
  }

  function findById(id: string) {
    return api.get(`/customers/${id}`);
  }

  function list(params = {}) {
    return api.get('/customers/list', { params });
  }

  function create(data: Partial<Customer>) {
    return api.post('/customers', data);
  }

  function update(id: string, data: Partial<Customer>) {
    return api.put(`/customers/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/customers/${id}`);
  }

  async function loadCustomers(params = {}) {
    const { data } = await api.get('/customers/list', { params });
    setCustomers(data);
  }

  return { findAll, findById, list, create, update, destroy, loadCustomers };
}
