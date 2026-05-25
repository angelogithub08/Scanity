<template>
  <DefaultPage>
    <template #header>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h6">Produtos em estoque</div>
          <div class="text-caption text-grey-7">
            Lista de produtos com quantidade atual e mínima em estoque.
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
              <td>{{ row.current_quantity }}</td>
              <td>{{ row.min_quantity }}</td>
              <td>{{ row.category_name }}</td>
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
  <StockProductsReportFiltersDrawer
    ref="filtersDrawerRef"
    :category-options="categoryOptions"
    :product-options="productOptions"
    @filtrate="loadReport"
    @clear="loadReport"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import StockProductsReportFiltersDrawer from 'src/components/reports/stock-products-report/StockProductsReportFiltersDrawer.vue';
import { useReportsResource } from 'src/composables/api/useReportsResource';
import { useHandleException } from 'src/composables/useHandleException';
import { usePagedPrint } from 'src/composables/usePagedPrint';
import { useDownload } from 'src/composables/useDownload';
import type { StockProductsReportItem, StockProductsReportParams } from 'src/interfaces/reports';
import { useCategoriesResource } from 'src/composables/api/useCategoriesResource';
import { useProductsResource } from 'src/composables/api/useProductsResource';
import { useAccountsStore } from 'src/stores/accounts';

const reportsResource = useReportsResource();
const categoriesResource = useCategoriesResource();
const productsResource = useProductsResource();
const accountsStore = useAccountsStore();
const { showError } = useHandleException();
const { print } = usePagedPrint({ title: 'Relatório - Produtos em estoque e quantidade' });
const { downloadFromHttpResponse } = useDownload();

const printAreaRef = ref<HTMLElement | null>(null);
const filtersDrawerRef = ref<InstanceType<typeof StockProductsReportFiltersDrawer> | null>(null);
const loading = ref(false);
const exporting = ref(false);
const rows = ref<StockProductsReportItem[]>([]);
const categoryOptions = ref<{ id: string; name: string }[]>([]);
const productOptions = ref<{ id: string; name: string }[]>([]);

const filters = ref<StockProductsReportParams>({});

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
    name: 'current_quantity',
    label: 'Quantidade atual',
    field: 'current_quantity',
    align: 'center',
    sortable: true,
  },
  {
    name: 'min_quantity',
    label: 'Quantidade mínima',
    field: 'min_quantity',
    align: 'center',
    sortable: true,
  },
  {
    name: 'category_name',
    label: 'Categoria',
    field: 'category_name',
    align: 'left',
    format: (val: string | null) => val ?? '-',
  },
];

async function loadReport() {
  loading.value = true;
  try {
    const account_id = accountsStore.currentAccount?.id as string;
    const params: StockProductsReportParams = {
      account_id,
    };
    filters.value = getAppliedFilters();

    if (filters.value.search) {
      params.search = filters.value.search;
    }
    if (filters.value.category_id) {
      params.category_id = filters.value.category_id;
    }
    if (filters.value.product_id) {
      params.product_id = filters.value.product_id;
    }

    const { data } = await reportsResource.getStockProducts(params);
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
    const params: StockProductsReportParams = { account_id };
    filters.value = getAppliedFilters();
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.category_id) params.category_id = filters.value.category_id;
    if (filters.value.product_id) params.product_id = filters.value.product_id;

    const response = await reportsResource.getStockProductsExport(params);
    downloadFromHttpResponse(response, 'relatorio-produtos-em-estoque.xlsx');
  } catch (error) {
    showError(error);
  } finally {
    exporting.value = false;
  }
}

function getAppliedFilters(): StockProductsReportParams {
  const drawerFilters = filtersDrawerRef.value?.formattedFilters;
  const parsedFilters: StockProductsReportParams = {};

  if (drawerFilters?.search) parsedFilters.search = drawerFilters.search;
  if (drawerFilters?.category_id) parsedFilters.category_id = drawerFilters.category_id;
  if (drawerFilters?.product_id) parsedFilters.product_id = drawerFilters.product_id;

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
