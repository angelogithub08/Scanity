import { api } from 'src/boot/axios';
import type { ProfilePermission } from 'src/interfaces/profile-permissions';
import { useProfilePermissionsStore } from 'src/stores/profile-permissions';

export function useProfilePermissionsResource() {
  const { setProfilePermissions } = useProfilePermissionsStore();
  function findAll(params = {}) {
    return api.get('/profile-permissions', { params });
  }

  function findById(id: string) {
    return api.get(`/profile-permissions/${id}`);
  }

  function list(params = {}) {
    return api.get('/profile-permissions/list', { params });
  }

  function create(data: Partial<ProfilePermission>) {
    return api.post('/profile-permissions', data);
  }

  function update(id: string, data: Partial<ProfilePermission>) {
    return api.put(`/profile-permissions/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/profile-permissions/${id}`);
  }

  async function loadProfilePermissions(params = {}) {
    const { data } = await api.get('/profile-permissions/list', { params });
    setProfilePermissions(data);
  }

  return { findAll, findById, list, create, update, destroy, loadProfilePermissions };
}
