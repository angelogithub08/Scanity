import { defineStore, acceptHMRUpdate } from 'pinia';
import type { InventoryCount } from 'src/interfaces/inventory-counts';
import { ref } from 'vue';

export const useInventoryCountsStore = defineStore('inventory-counts', () => {
  const currentInventoryCount = ref<Partial<InventoryCount>>();
  const inventoryCounts = ref<Partial<InventoryCount>[]>([]);

  function setCurrentInventoryCount(data: Partial<InventoryCount>) {
    currentInventoryCount.value = data;
  }

  function setInventoryCounts(data: Partial<InventoryCount>[]) {
    inventoryCounts.value = data;
  }

  return { inventoryCounts, setInventoryCounts, currentInventoryCount, setCurrentInventoryCount };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInventoryCountsStore, import.meta.hot));
}
