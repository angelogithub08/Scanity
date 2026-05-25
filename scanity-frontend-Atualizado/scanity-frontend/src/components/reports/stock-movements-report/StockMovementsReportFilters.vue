<template>
  <div class="row q-col-gutter-sm">
    <div class="col-12">
      <q-input
        v-model="filters.barcode"
        label="Código de barras"
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

    <div class="col-12">
      <q-select
        v-model="filters.user_id"
        :options="userOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        label="Usuário"
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
import type { StockMovementsReportParams } from 'src/interfaces/reports';

defineProps<{
  productOptions: { id: string; name: string }[];
  userOptions: { id: string; name: string }[];
  typeOptions: { label: string; value: 'ENTRADA' | 'SAIDA' }[];
}>();

const filters = reactive<StockMovementsReportParams>({
  barcode: null,
  product_id: null,
  type: null,
  user_id: null,
});

const formattedFilters = computed<StockMovementsReportParams>(() => cloneDeep(filters));

function clearFilters() {
  filters.barcode = null;
  filters.product_id = null;
  filters.type = null;
  filters.user_id = null;
}

defineExpose({
  formattedFilters,
  clearFilters,
});
</script>
