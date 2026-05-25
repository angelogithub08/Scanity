import { api } from 'src/boot/axios';
import type { User } from 'src/interfaces/users';
import { useUsersStore } from 'src/stores/users';

export function useUsersResource() {
  const { setUsers } = useUsersStore();

  function findAll(params = {}) {
    return api.get('/users', { params });
  }

  function findById(id: string) {
    return api.get(`/users/${id}`);
  }

  function list(params = {}) {
    return api.get('/users/list', { params });
  }

  function create(data: Partial<User>) {
    return api.post('/users', data);
  }

  function update(id: string, data: Partial<User>) {
    return api.put(`/users/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/users/${id}`);
  }

  async function loadUsers(params = {}) {
    const { data } = await api.get('/users/list', { params });
    setUsers(data);
  }

  return { findAll, findById, list, create, update, destroy, loadUsers };
}
