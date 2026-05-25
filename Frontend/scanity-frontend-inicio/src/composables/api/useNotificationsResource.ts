import { api } from 'src/boot/axios';
import type { Notification } from 'src/interfaces/notifications';
import { useNotificationsStore } from 'src/stores/notifications';

export function useNotificationsResource() {
  const { setNotifications } = useNotificationsStore();

  function findAll(params = {}) {
    return api.get('/notifications', { params });
  }

  function findById(id: string) {
    return api.get(`/notifications/${id}`);
  }

  function list(params = {}) {
    return api.get('/notifications/list', { params });
  }

  function create(data: Partial<Notification>) {
    return api.post('/notifications', data);
  }

  function update(id: string, data: Partial<Notification>) {
    return api.put(`/notifications/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/notifications/${id}`);
  }

  async function loadNotifications(params = {}) {
    const { data } = await api.get('/notifications/list', { params });
    setNotifications(data);
  }

  return { findAll, findById, list, create, update, destroy, loadNotifications };
}
