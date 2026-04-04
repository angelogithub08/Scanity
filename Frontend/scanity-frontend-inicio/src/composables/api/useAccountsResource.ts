import { api } from 'src/boot/axios';
import type { Account } from 'src/interfaces/accounts';
import { useAccountsStore } from 'src/stores/accounts';

export function useAccountsResource() {
  const { setAccounts } = useAccountsStore();

  function findAll(params = {}) {
    return api.get('/accounts', { params });
  }

  function findById(id: string) {
    return api.get(`/accounts/${id}`);
  }

  function list(params = {}) {
    return api.get('/accounts/list', { params });
  }

  function create(data: Partial<Account>) {
    return api.post('/accounts', data);
  }

  function register(data: Partial<Account & { password: string }>) {
    return api.post('/accounts/register', data);
  }

  function update(id: string, data: Partial<Account>) {
    return api.put(`/accounts/${id}`, data);
  }

  function destroy(id: string) {
    return api.delete(`/accounts/${id}`);
  }

  function requestDeleteAccount(email: string) {
    return api.post('/accounts/request-delete-account', { email });
  }

  async function loadAccounts(params = {}) {
    const { data } = await api.get('/accounts/list', { params });
    setAccounts(data);
  }

  return {
    findAll,
    findById,
    list,
    create,
    register,
    update,
    destroy,
    requestDeleteAccount,
    loadAccounts,
  };
}
