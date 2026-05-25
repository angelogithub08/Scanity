import { api } from 'src/boot/axios';
import type { Permission } from 'src/interfaces/permissions';
import { usePermissionsStore } from 'src/stores/permissions';

export function usePermissionsResource() {
  const { setPermissions } = usePermissionsStore();
  function findAll(params = {}) {
    return api.get('/permissions', { params });
  }

  function findById(id: string) {
    return api.get(`/permissions/${id}`);
  }

  function list(params = {}) {
    return api.get('/permissions/list', { params });
  }

  function create(data: Partial<Permission>) {
    return api.post('/permissions', data);
  }

  function update(id: string, data: Partial<Permission>) {
    return api.put(`/permissions/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/permissions/${id}`);
  }

  function findByProfileId(profileId: string) {
    return api.get(`/permissions/profile/${profileId}`);
  }

  async function loadPermissions(params = {}) {
    const { data } = await api.get('/permissions/list', { params });
    setPermissions(data);
  }

  return { findAll, findById, list, create, update, destroy, loadPermissions, findByProfileId };
}
