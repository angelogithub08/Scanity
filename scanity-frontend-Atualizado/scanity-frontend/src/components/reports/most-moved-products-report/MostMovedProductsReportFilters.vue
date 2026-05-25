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

    <div class="col-12">
      <q-select
        v-model="filters.type"
        :options="typeOptions"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        label="Tipo de movimentação"
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

interface ReportFilters {
  search?: string | undefined;
  category_id?: string | undefined;
  product_id?: string | undefined;
  type?: 'ENTRADA' | 'SAIDA' | undefined;
}

defineProps<{
  categoryOptions: { id: string; name: string }[];
  productOptions: { id: string; name: string }[];
  typeOptions: { label: string; value: 'ENTRADA' | 'SAIDA' }[];
}>();

const filters = reactive<ReportFilters>({
  search: undefined,
  category_id: undefined,
  product_id: undefined,
  type: undefined,
});

const formattedFilters = computed<ReportFilters>(() => {
  const newFilters = cloneDeep(filters);
  return newFilters;
});

function clearFilters() {
  filters.search = undefined;
  filters.category_id = undefined;
  filters.product_id = undefined;
  filters.type = undefined;
}

defineExpose({
  formattedFilters,
  clearFilters,
});
</script>
