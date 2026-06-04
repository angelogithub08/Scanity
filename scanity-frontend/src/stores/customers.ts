import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Customer } from 'src/interfaces/customers';
import { ref } from 'vue';

export const useCustomersStore = defineStore('customers', () => {
  const currentCustomer = ref<Partial<Customer>>();
  const customers = ref<Partial<Customer>[]>([]);

  function setCurrentCustomer(data: Partial<Customer>) {
    currentCustomer.value = data;
  }

  function setCustomers(data: Partial<Customer>[]) {
    customers.value = data;
  }

  return { customers, setCustomers, currentCustomer, setCurrentCustomer };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCustomersStore, import.meta.hot));
}
