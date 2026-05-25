<template>
  <DefaultPage>
    <template #header>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h6">Movimentações de estoque</div>
          <div class="text-caption text-grey-7">
            Visão das movimentações de estoque com código de barras, produto, tipo, quantidade e
            usuário.
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
              <th v-for="column in columns" :key="column.name">
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr v-for="(row, index) in rows" :key="index">
              <td>{{ row.barcode ?? '-' }}</td>
              <td>{{ row.product_name }}</td>
              <td>{{ formatType(row.type) }}</td>
              <td>{{ Math.abs(row.quantity) }}</td>
              <td>{{ row.user_name ?? '-' }}</td>
              <td>{{ datetimeToClient(row.created_at as string) ?? '-' }}</td>
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
  <StockMovementsReportFiltersDrawer
    ref="filtersDrawerRef"
    :product-options="productOptions"
    :user-options="userOptions"
    :type-options="typeOptions"
    @filtrate="loadReport"
    @clear="loadReport"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import StockMovementsReportFiltersDrawer from 'src/components/reports/stock-movements-report/StockMovementsReportFiltersDrawer.vue';
import { useReportsResource } from 'src/composables/api/useReportsResource';
import { useHandleException } from 'src/composables/useHandleException';
import { usePagedPrint } from 'src/composables/usePagedPrint';
import { useDownload } from 'src/composables/useDownload';
import type { StockMovementsReportItem, StockMovementsReportParams } from 'src/interfaces/reports';
import { useProductsResource } from 'src/composables/api/useProductsResource';
import { useUsersResource } from 'src/composables/api/useUsersResource';
import { useAccountsStore } from 'src/stores/accounts';
import { useDate } from 'src/composables/useDate';

const reportsResource = useReportsResource();
const productsResource = useProductsResource();
const usersResource = useUsersResource();
const accountsStore = useAccountsStore();
const { showError } = useHandleException();
const { print } = usePagedPrint({
  title: 'Relatório - Movimentações de estoque',
});
const { downloadFromHttpResponse } = useDownload();
const { datetimeToClient } = useDate();

const printAreaRef = ref<HTMLElement | null>(null);
const filtersDrawerRef = ref<InstanceType<typeof StockMovementsReportFiltersDrawer> | null>(null);
const loading = ref(false);
const exporting = ref(false);
const rows = ref<StockMovementsReportItem[]>([]);
const productOptions = ref<{ id: string; name: string }[]>([]);
const userOptions = ref<{ id: string; name: string }[]>([]);

const typeOptions: { label: string; value: 'ENTRADA' | 'SAIDA' }[] = [
  { label: 'Entrada', value: 'ENTRADA' },
  { label: 'Saída', value: 'SAIDA' },
];

const filters = ref<StockMovementsReportParams>({});

const columns: QTableColumn[] = [
  {
    name: 'barcode',
    label: 'Código de barras',
    field: 'barcode',
    align: 'left',
    sortable: true,
  },
  {
    name: 'product_name',
    label: 'Produto',
    field: 'product_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'type',
    label: 'Tipo de movimentação',
    field: 'type',
    align: 'center',
    sortable: true,
  },
  {
    name: 'quantity',
    label: 'Quantidade',
    field: 'quantity',
    align: 'center',
    sortable: true,
  },
  {
    name: 'user_name',
    label: 'Usuário',
    field: 'user_name',
    align: 'left',
    format: (val: string | null) => val ?? '-',
  },
  {
    name: 'created_at',
    label: 'Movimentado em',
    field: 'created_at',
    align: 'left',
    format: (val: string | null) => datetimeToClient(val as string) || '-',
  },
];

function formatType(type: string) {
  return type === 'ENTRADA' ? 'Entrada' : type === 'SAIDA' ? 'Saída' : type;
}

async function loadReport() {
  loading.value = true;
  try {
    const account_id = accountsStore.currentAccount?.id as string;
    const params: StockMovementsReportParams = {
      account_id,
    };
    filters.value = getAppliedFilters();

    if (filters.value.barcode) {
      params.barcode = filters.value.barcode;
    }
    if (filters.value.product_id) {
      params.product_id = filters.value.product_id;
    }
    if (filters.value.type) {
      params.type = filters.value.type;
    }
    if (filters.value.user_id) {
      params.user_id = filters.value.user_id;
    }

    const { data } = await reportsResource.getStockMovements(params);
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
    const params: StockMovementsReportParams = { account_id };
    filters.value = getAppliedFilters();
    if (filters.value.barcode) params.barcode = filters.value.barcode;
    if (filters.value.product_id) params.product_id = filters.value.product_id;
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.user_id) params.user_id = filters.value.user_id;

    const response = await reportsResource.getStockMovementsExport(params);
    downloadFromHttpResponse(response, 'relatorio-movimentacoes-estoque.xlsx');
  } catch (error) {
    showError(error);
  } finally {
    exporting.value = false;
  }
}

function getAppliedFilters(): StockMovementsReportParams {
  const drawerFilters = filtersDrawerRef.value?.formattedFilters;
  const parsedFilters: StockMovementsReportParams = {};

  if (drawerFilters?.barcode) parsedFilters.barcode = drawerFilters.barcode;
  if (drawerFilters?.product_id) parsedFilters.product_id = drawerFilters.product_id;
  if (drawerFilters?.type) parsedFilters.type = drawerFilters.type;
  if (drawerFilters?.user_id) parsedFilters.user_id = drawerFilters.user_id;

  return parsedFilters;
}

onMounted(async () => {
  const account_id = accountsStore.currentAccount?.id;
  if (account_id) {
    try {
      const [prodRes, userRes] = await Promise.all([
        productsResource.list({ account_id }),
        usersResource.list({ account_id }),
      ]);
      productOptions.value = prodRes.data;
      userOptions.value = userRes.data;
    } catch (e) {
      // opcional: filtros podem falhar
    }
  }
  void loadReport();
});
</script>
