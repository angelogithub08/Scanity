<template>
  <div class="row q-col-gutter-sm">
    <div class="col-12">
      <q-input
        v-model="filters.search"
        label="Pesquisar"
        bg-color="white"
        outlined
        dense
        clearable
      />
    </div>

    <div class="col-12">
      <q-select
        v-model="filters.category_id"
        :options="categoryOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        label="Categoria"
        bg-color="white"
        outlined
        dense
        clearable
      />
    </div>

    <div class="col-12">
      <q-select
        v-model="filters.product_id"
        :options="productOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        label="Produto"
        bg-color="white"
        outlined
        dense
        clearable
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { cloneDeep } from 'lodash';
import type { StockProductsReportParams } from 'src/interfaces/reports';

defineProps<{
  categoryOptions: { id: string; name: string }[];
  productOptions: { id: string; name: string }[];
}>();

const filters = reactive<StockProductsReportParams>({
  search: null,
  category_id: null,
  product_id: null,
});

const formattedFilters = computed<StockProductsReportParams>(() => cloneDeep(filters));

function clearFilters() {
  filters.search = null;
  filters.category_id = null;
  filters.product_id = null;
}

defineExpose({
  formattedFilters,
  clearFilters,
});
</script>
