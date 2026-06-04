import { api } from 'src/boot/axios';
import type { Profile } from 'src/interfaces/profiles';
import { useProfilesStore } from 'src/stores/profiles';

export function useProfilesResource() {
  const { setProfiles } = useProfilesStore();
  function findAll(params = {}) {
    return api.get('/profiles', { params });
  }

  function findById(id: string) {
    return api.get(`/profiles/${id}`);
  }

  function list(params = {}) {
    return api.get('/profiles/list', { params });
  }

  function create(data: Partial<Profile>) {
    return api.post('/profiles', data);
  }

  function update(id: string, data: Partial<Profile>) {
    return api.put(`/profiles/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/profiles/${id}`);
  }

  function syncPermissions(id: string, permission_ids: string[]) {
    return api.put(`/profiles/${id}/permissions`, { permission_ids });
  }

  async function loadProfiles(params = {}) {
    const { data } = await api.get('/profiles/list', { params });
    setProfiles(data);
  }

  return { findAll, findById, list, create, update, destroy, loadProfiles, syncPermissions };
}
