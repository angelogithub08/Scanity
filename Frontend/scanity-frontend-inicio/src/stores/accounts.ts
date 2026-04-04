import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Account } from 'src/interfaces/accounts';
import { ref } from 'vue';

export const useAccountsStore = defineStore('accounts', () => {
  const currentAccount = ref<Partial<Account>>();
  const accounts = ref<Partial<Account>[]>([]);

  function setCurrentAccount(data: Partial<Account>) {
    currentAccount.value = data;
  }

  function setAccounts(data: Partial<Account>[]) {
    accounts.value = data;
  }

  return { accounts, setAccounts, currentAccount, setCurrentAccount };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccountsStore, import.meta.hot));
}
