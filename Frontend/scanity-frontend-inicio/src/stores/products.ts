import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Product } from 'src/interfaces/products';
import { ref } from 'vue';

export const useProductsStore = defineStore('products', () => {
  const currentProduct = ref<Partial<Product>>();
  const products = ref<Partial<Product>[]>([]);

  function setCurrentProduct(data: Partial<Product>) {
    currentProduct.value = data;
  }

  function setProducts(data: Partial<Product>[]) {
    products.value = data;
  }

  return { products, setProducts, currentProduct, setCurrentProduct };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProductsStore, import.meta.hot));
}
