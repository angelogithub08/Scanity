<template>
  <q-drawer
    v-model="show"
    :width="300"
    :breakpoint="500"
    behavior="mobile"
    side="right"
    overlay
    elevated
  >
    <div class="flex items-end justify-end q-pa-sm q-pb-none">
      <q-btn icon="close" round flat dense @click="close" />
    </div>
    <q-scroll-area style="height: calc(100vh - 102px)" class="q-pa-sm">
      <StockProductsReportFilters
        ref="filterRef"
        :category-options="categoryOptions"
        :product-options="productOptions"
      />
    </q-scroll-area>
    <div class="flex bg-grey-2 items-end justify-end q-pa-sm">
      <q-btn label="Limpar" unelevated @click="clearFilters()" />
      <q-btn label="Filtrar" unelevated @click="filtrate()" color="primary" class="q-ml-sm" />
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import StockProductsReportFilters from './StockProductsReportFilters.vue';

defineProps<{
  categoryOptions: { id: string; name: string }[];
  productOptions: { id: string; name: string }[];
}>();

const show = ref(false);
const filterRef = ref<InstanceType<typeof StockProductsReportFilters> | null>(null);

const emit = defineEmits(['filtrate', 'clear']);

const formattedFilters = computed(() => filterRef.value?.formattedFilters);

function open() {
  show.value = true;
}

function close() {
  show.value = false;
}

function filtrate() {
  emit('filtrate');
}

function clearFilters() {
  filterRef.value?.clearFilters();
  emit('clear');
}

defineExpose({
  formattedFilters,
  open,
  close,
});
</script>
