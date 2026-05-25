<template>
  <DefaultPage>
    <template #header>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h6">Produtos mais movimentados</div>
          <div class="text-caption text-grey-7">
            Resumo por produto com totais de entradas, saídas e volume total movimentado.
          </div>
        </div>
        <div class="row q-gutter-sm items-center">
          <q-btn
            color="grey-8"
            icon="print"
            label="Imprimir"
            outline
            :disable="rows.length === 0"
            @click="handlePrint"
          />
          <q-btn
            color="green-8"
            icon="table_chart"
            label="Exportar Excel"
            outline
            :loading="exporting"
            :disable="rows.length === 0"
            @click="handleExportExcel"
          />
        </div>
      </div>
    </template>
    <template #content>
      <div ref="printAreaRef">
        <q-markup-table :data="rows" :columns="columns" :loading="loading">
          <thead class="text-center">
            <tr>
              <th v-for="column in columns" :key="column.name">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr v-for="row in rows" :key="row.product_id">
              <td>{{ row.barcode ?? '-' }}</td>
              <td>{{ row.product_name }}</td>
              <td>{{ row.category_name ?? '-' }}</td>
              <td>{{ row.entries_quantity }}</td>
              <td>{{ row.exits_quantity }}</td>
              <td>{{ row.total_quantity }}</td>
              <td>{{ row.movements_count }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
    </template>
    <template #filters>
      <q-page-sticky position="bottom-right" :offset="[16, 16]">
        <q-btn fab icon="filter_list" color="primary" @click="openFiltersDrawer" />
      </q-page-sticky>
    </template>
  </DefaultPage>
  <MostMovedProductsReportFiltersDrawer
    ref="filtersDrawerRef"
    :category-options="categoryOptions"
    :product-options="productOptions"
    :type-options="typeOptions"
    @filtrate="loadReport"
    @clear="loadReport"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import { useReportsResource } from 'src/composables/api/useReportsResource';
import { useHandleException } from 'src/composables/useHandleException';
import { usePagedPrint } from 'src/composables/usePagedPrint';
import { useDownload } from 'src/composables/useDownload';
import type {
  MostMovedProductsReportItem,
  MostMovedProductsReportParams,
} from 'src/interfaces/reports';
import { useCategoriesResource } from 'src/composables/api/useCategoriesResource';
import { useProductsResource } from 'src/composables/api/useProductsResource';
import { useAccountsStore } from 'src/stores/accounts';
import MostMovedProductsReportFiltersDrawer from 'src/components/reports/most-moved-products-report/MostMovedProductsReportFiltersDrawer.vue';

const reportsResource = useReportsResource();
const categoriesResource = useCategoriesResource();
const productsResource = useProductsResource();
const accountsStore = useAccountsStore();
const { showError } = useHandleException();
const { print } = usePagedPrint({
  title: 'Relatório - Produtos mais movimentados',
});
const { downloadFromHttpResponse } = useDownload();

const printAreaRef = ref<HTMLElement | null>(null);
const filtersDrawerRef = ref<InstanceType<typeof MostMovedProductsReportFiltersDrawer> | null>(
  null,
);
const loading = ref(false);
const exporting = ref(false);
const rows = ref<MostMovedProductsReportItem[]>([]);
const categoryOptions = ref<{ id: string; name: string }[]>([]);
const productOptions = ref<{ id: string; name: string }[]>([]);
const typeOptions: { label: string; value: 'ENTRADA' | 'SAIDA' }[] = [
  { label: 'Entrada', value: 'ENTRADA' },
  { label: 'Saída', value: 'SAIDA' },
];

const filters = ref<MostMovedProductsReportParams>({});

const columns: QTableColumn[] = [
  {
    name: 'barcode',
    label: 'Código de barras',
    field: 'barcode',
    align: 'left',
    format: (val: string | null) => val ?? '-',
  },
  { name: 'product_name', label: 'Produto', field: 'product_name', align: 'left', sortable: true },
  {
    name: 'category_name',
    label: 'Categoria',
    field: 'category_name',
    align: 'left',
    format: (val: string | null) => val ?? '-',
  },

  {
    name: 'entries_quantity',
    label: 'Entradas',
    field: 'entries_quantity',
    align: 'center',
    sortable: true,
  },
  {
    name: 'exits_quantity',
    label: 'Saídas',
    field: 'exits_quantity',
    align: 'center',
    sortable: true,
  },
  {
    name: 'total_quantity',
    label: 'Total movimentado',
    field: 'total_quantity',
    align: 'center',
    sortable: true,
  },
  {
    name: 'movements_count',
    label: 'Movimentações',
    field: 'movements_count',
    align: 'center',
    sortable: true,
  },
];

async function loadReport() {
  loading.value = true;
  try {
    const account_id = accountsStore.currentAccount?.id as string;
    const params: MostMovedProductsReportParams = { account_id };
    filters.value = getAppliedFilters();

    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.category_id) params.category_id = filters.value.category_id;
    if (filters.value.product_id) params.product_id = filters.value.product_id;
    if (filters.value.type) params.type = filters.value.type;

    const { data } = await reportsResource.getMostMovedProducts(params);
    rows.value = data.data;
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
}

function handlePrint() {
  const el = printAreaRef.value;
  if (el) {
    print(el);
  }
}

function openFiltersDrawer() {
  filtersDrawerRef.value?.open();
}

async function handleExportExcel() {
  exporting.value = true;
  try {
    const account_id = accountsStore.currentAccount?.id as string;
    const params: MostMovedProductsReportParams = { account_id };
    filters.value = getAppliedFilters();
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.category_id) params.category_id = filters.value.category_id;
    if (filters.value.product_id) params.product_id = filters.value.product_id;
    if (filters.value.type) params.type = filters.value.type;

    const response = await reportsResource.getMostMovedProductsExport(params);
    downloadFromHttpResponse(response, 'relatorio-produtos-mais-movimentados.xlsx');
  } catch (error) {
    showError(error);
  } finally {
    exporting.value = false;
  }
}

function getAppliedFilters(): MostMovedProductsReportParams {
  const drawerFilters = filtersDrawerRef.value?.formattedFilters;
  const parsedFilters: MostMovedProductsReportParams = {};

  if (drawerFilters?.search) parsedFilters.search = drawerFilters.search;
  if (drawerFilters?.category_id) parsedFilters.category_id = drawerFilters.category_id;
  if (drawerFilters?.product_id) parsedFilters.product_id = drawerFilters.product_id;
  if (drawerFilters?.type) parsedFilters.type = drawerFilters.type;

  return parsedFilters;
}

onMounted(async () => {
  const account_id = accountsStore.currentAccount?.id;
  if (account_id) {
    try {
      const [catRes, prodRes] = await Promise.all([
        categoriesResource.list({ account_id }),
        productsResource.list({ account_id }),
      ]);
      categoryOptions.value = catRes.data;
      productOptions.value = prodRes.data;
    } catch (e) {
      // opcional: filtros podem falhar
    }
  }
  void loadReport();
});
</script>
