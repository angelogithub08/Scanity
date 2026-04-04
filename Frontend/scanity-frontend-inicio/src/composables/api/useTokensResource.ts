import { api } from 'src/boot/axios';
import type { Token } from 'src/interfaces/tokens';
import { useTokensStore } from 'src/stores/tokens';

export function useTokensResource() {
  const { setTokens } = useTokensStore();

  function findAll(params = {}) {
    return api.get('/tokens', { params });
  }

  function findById(id: string) {
    return api.get(`/tokens/${id}`);
  }

  function list(params = {}) {
    return api.get('/tokens/list', { params });
  }

  function create(data: Partial<Token>) {
    return api.post('/tokens', data);
  }

  function update(id: string, data: Partial<Token>) {
    return api.put(`/tokens/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/tokens/${id}`);
  }

  async function loadTokens(params = {}) {
    const { data } = await api.get('/tokens/list', { params });
    setTokens(data);
  }

  return { findAll, findById, list, create, update, destroy, loadTokens };
}
