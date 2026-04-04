import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Stock } from 'src/interfaces/stocks';
import { ref } from 'vue';

export const useStocksStore = defineStore('stocks', () => {
  const currentStock = ref<Partial<Stock>>();
  const stocks = ref<Partial<Stock>[]>([]);

  function setCurrentStock(data: Partial<Stock>) {
    currentStock.value = data;
  }

  function setStocks(data: Partial<Stock>[]) {
    stocks.value = data;
  }

  return { stocks, setStocks, currentStock, setCurrentStock };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStocksStore, import.meta.hot));
}
