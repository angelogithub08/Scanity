import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Suplier } from 'src/interfaces/supliers';
import { ref } from 'vue';

export const useSupliersStore = defineStore('supliers', () => {
  const currentSuplier = ref<Partial<Suplier>>();
  const supliers = ref<Partial<Suplier>[]>([]);

  function setCurrentSuplier(data: Partial<Suplier>) {
    currentSuplier.value = data;
  }

  function setSupliers(data: Partial<Suplier>[]) {
    supliers.value = data;
  }

  return { supliers, setSupliers, currentSuplier, setCurrentSuplier };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSupliersStore, import.meta.hot));
}
