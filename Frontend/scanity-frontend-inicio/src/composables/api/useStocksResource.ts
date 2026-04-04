import { api } from 'src/boot/axios';
import type { Stock } from 'src/interfaces/stocks';
import { useStocksStore } from 'src/stores/stocks';

export function useStocksResource() {
  const { setStocks } = useStocksStore();

  function findAll(params = {}) {
    return api.get('/stocks', { params });
  }

  function findById(id: string) {
    return api.get(`/stocks/${id}`);
  }

  function list(params = {}) {
    return api.get('/stocks/list', { params });
  }

  function create(data: Partial<Stock>) {
    return api.post('/stocks', data);
  }

  function quickMovement(data: {
    barcode: string;
    type: 'ENTRADA' | 'SAIDA';
    movement_stage_id?: string;
  }) {
    return api.post<{ message: string }>('/stocks/quick-movement', data);
  }

  function update(id: string, data: Partial<Stock>) {
    return api.put(`/stocks/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/stocks/${id}`);
  }

  async function loadStocks(params = {}) {
    const { data } = await api.get('/stocks/list', { params });
    setStocks(data);
  }

  return {
    findAll,
    findById,
    list,
    create,
    update,
    destroy,
    loadStocks,
    quickMovement,
  };
}
