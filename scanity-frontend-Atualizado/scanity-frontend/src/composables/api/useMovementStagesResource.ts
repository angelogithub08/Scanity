import { api } from 'src/boot/axios';
import type { MovementStage } from 'src/interfaces/movement-stages';
import { useMovementStagesStore } from 'src/stores/movement-stages';

export function useMovementStagesResource() {
  const { setMovementStages } = useMovementStagesStore();

  function findAll(params = {}) {
    return api.get('/movement-stages', { params });
  }

  function findById(id: string) {
    return api.get(`/movement-stages/${id}`);
  }

  function list(params = {}) {
    return api.get('/movement-stages/list', { params });
  }

  function create(data: Partial<MovementStage>) {
    return api.post('/movement-stages', data);
  }

  function update(id: string, data: Partial<MovementStage>) {
    return api.put(`/movement-stages/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/movement-stages/${id}`);
  }

  async function loadMovementStages(params = {}) {
    const { data } = await api.get('/movement-stages/list', { params });
    setMovementStages(data);
  }

  return { findAll, findById, list, create, update, destroy, loadMovementStages };
}
