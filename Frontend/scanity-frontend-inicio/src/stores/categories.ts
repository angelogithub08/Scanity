import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Category } from 'src/interfaces/categories';
import { ref } from 'vue';

export const useCategoriesStore = defineStore('categories', () => {
  const currentCategory = ref<Partial<Category>>();
  const categories = ref<Partial<Category>[]>([]);

  function setCurrentCategory(data: Partial<Category>) {
    currentCategory.value = data;
  }

  function setCategories(data: Partial<Category>[]) {
    categories.value = data;
  }

  return { categories, setCategories, currentCategory, setCurrentCategory };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCategoriesStore, import.meta.hot));
}
