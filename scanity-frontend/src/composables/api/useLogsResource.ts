import { api } from 'src/boot/axios';
import type { Log } from 'src/interfaces/logs';
import { useLogsStore } from 'src/stores/logs';

export function useLogsResource() {
  const { setLogs } = useLogsStore();

  function findAll(params = {}) {
    return api.get('/logs', { params });
  }

  function findById(id: string) {
    return api.get(`/logs/${id}`);
  }

  function list(params = {}) {
    return api.get('/logs/list', { params });
  }

  function create(data: Partial<Log>) {
    return api.post('/logs', data);
  }

  function update(id: string, data: Partial<Log>) {
    return api.put(`/logs/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/logs/${id}`);
  }

  async function loadLogs(params = {}) {
    const { data } = await api.get('/logs/list', { params });
    setLogs(data);
  }

  return { findAll, findById, list, create, update, destroy, loadLogs };
}
