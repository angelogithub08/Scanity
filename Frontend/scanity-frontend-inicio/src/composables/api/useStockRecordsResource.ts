import { api } from 'src/boot/axios';
import type { StockRecord } from 'src/interfaces/stock-records';

export function useStockRecordsResource() {
  function findAll(params = {}) {
    return api.get('/stock-records', { params });
  }

  function findById(id: string) {
    return api.get(`/stock-records/${id}`);
  }

  function list(params = {}) {
    return api.get('/stock-records/list', { params });
  }

  function create(data: Partial<StockRecord>) {
    return api.post('/stock-records', data);
  }

  function update(id: string, data: Partial<StockRecord>) {
    return api.put(`/stock-records/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/stock-records/${id}`);
  }

  return { findAll, findById, list, create, update, destroy };
}
