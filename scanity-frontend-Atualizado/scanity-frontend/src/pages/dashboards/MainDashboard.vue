<template>
  <q-page padding>
    <div>
      <!-- Contadores -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <counter-card
            title="Produtos"
            :value="dashboardData.productsTotal"
            icon="inventory_2"
            :loading="loadingCounters"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <counter-card
            title="Clientes"
            :value="dashboardData.customersTotal"
            icon="people"
            :loading="loadingCounters"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <counter-card
            title="Itens em estoque"
            :value="dashboardData.stocksTotal"
            icon="warehouse"
            :loading="loadingCounters"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <counter-card
            title="Abaixo do mínimo"
            :value="dashboardData.belowMinimumTotal"
            icon="warning"
            :loading="loadingCounters"
          />
        </div>
      </div>

      <!-- Gráficos -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-8">
          <chart-card
            title="Movimentações mensais (Entradas x Saídas)"
            type="bar"
            :chart-options="movementsChartOptions"
            :series="movementsChartSeries"
            :loading="loadingCharts"
          />
        </div>
        <div class="col-12 col-md-4">
          <chart-card
            title="Distribuição por tipo"
            type="pie"
            :chart-options="pieChartOptions"
            :series="pieChartSeries"
            :loading="loadingCharts"
          />
        </div>
      </div>

      <!-- Tabela -->
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <table-card
            title="Últimas movimentações de estoque"
            :rows="tableData"
            :columns="tableColumns"
            :loading="loadingTable"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import CounterCard from 'src/components/dashboards/main/CounterCard.vue';
import ChartCard from 'src/components/dashboards/main/ChartCard.vue';
import TableCard from 'src/components/dashboards/main/TableCard.vue';
import { useAccountsStore } from 'src/stores/accounts';
import { useProductsResource } from 'src/composables/api/useProductsResource';
import { useCustomersResource } from 'src/composables/api/useCustomersResource';
import { useStocksResource } from 'src/composables/api/useStocksResource';
import { useReportsResource } from 'src/composables/api/useReportsResource';
import { useDate } from 'src/composables/useDate';
import type { StockMovementsReportItem } from 'src/interfaces/reports';

const accountsStore = useAccountsStore();
const productsResource = useProductsResource();
const customersResource = useCustomersResource();
const stocksResource = useStocksResource();
const reportsResource = useReportsResource();
const { datetimeToClient } = useDate();

const loadingCounters = ref(false);
const loadingCharts = ref(false);
const loadingTable = ref(false);

const dashboardData = ref({
  productsTotal: 0,
  customersTotal: 0,
  stocksTotal: 0,
  belowMinimumTotal: 0,
});

const movementsData = ref<StockMovementsReportItem[]>([]);

const currentAccount = computed(() => accountsStore.currentAccount);

// Gráfico de barras: movimentações por mês (últimos 12 meses)
const movementsChartOptions = {
  chart: { toolbar: { show: false } },
  plotOptions: {
    bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 },
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: {
    categories: (() => {
      const months: string[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleDateString('pt-BR', { month: 'short' }));
      }
      return months;
    })(),
  },
  yaxis: { title: { text: 'Quantidade' } },
  fill: { opacity: 1 },
  legend: { position: 'top' },
  theme: { mode: 'light' },
};

const movementsChartSeries = computed(() => {
  const now = new Date();
  const entradasPorMes: number[] = [];
  const saidasPorMes: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const ano = now.getFullYear();
    const mes = now.getMonth() - i;
    const anoMes =
      mes < 0
        ? `${ano - 1}-${String(12 + mes).padStart(2, '0')}`
        : `${ano}-${String(mes + 1).padStart(2, '0')}`;
    let e = 0,
      s = 0;
    movementsData.value.forEach((m) => {
      if (!m.created_at) return;
      const d = new Date(m.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key !== anoMes) return;
      const qty = Math.abs(Number(m.quantity)) || 0;
      if (m.type === 'ENTRADA') e += qty;
      else if (m.type === 'SAIDA') s += qty;
    });
    entradasPorMes.push(e);
    saidasPorMes.push(s);
  }
  return [
    { name: 'Entradas', data: entradasPorMes },
    { name: 'Saídas', data: saidasPorMes },
  ];
});

// Gráfico de pizza: Entradas vs Saídas (quantidade)
const pieChartOptions = {
  chart: { toolbar: { show: false } },
  labels: ['Entradas', 'Saídas'],
  responsive: [
    { breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } },
  ],
  colors: ['#43e97b', '#fa709a'],
};

const pieChartSeries = computed(() => {
  let entradas = 0,
    saidas = 0;
  movementsData.value.forEach((m) => {
    const qty = Math.abs(Number(m.quantity)) || 0;
    if (m.type === 'ENTRADA') entradas += qty;
    else if (m.type === 'SAIDA') saidas += qty;
  });
  return [entradas, saidas];
});

const tableColumns: {
  name: string;
  label: string;
  field: string;
  sortable: boolean;
  align: 'left' | 'right' | 'center';
}[] = [
  { name: 'product_name', label: 'Produto', field: 'product_name', sortable: true, align: 'left' },
  { name: 'type', label: 'Tipo', field: 'type', sortable: true, align: 'center' },
  { name: 'quantity', label: 'Quantidade', field: 'quantity', sortable: true, align: 'right' },
  { name: 'user_name', label: 'Usuário', field: 'user_name', sortable: true, align: 'left' },
  { name: 'created_at', label: 'Data', field: 'created_at', sortable: true, align: 'left' },
];

const tableData = computed(() => {
  return movementsData.value.slice(0, 10).map((m, idx) => ({
    ...m,
    _rowKey: `mov-${idx}-${m.created_at ?? ''}-${m.product_name}`,
    created_at: m.created_at ? datetimeToClient(m.created_at) : '',
  }));
});

async function loadCounters() {
  const accountId = currentAccount.value?.id;
  if (!accountId) return;
  loadingCounters.value = true;
  try {
    const [productsRes, customersRes, stocksRes, belowRes] = await Promise.all([
      productsResource.findAll({ page: 1, limit: 1, account_id: accountId }),
      customersResource.findAll({ page: 1, limit: 1, account_id: accountId }),
      stocksResource.findAll({ page: 1, limit: 1, account_id: accountId }),
      reportsResource.getStockBelowMinimum({ account_id: accountId }),
    ]);
    const belowArr = (belowRes as any).data?.data ?? (belowRes as any).data;
    dashboardData.value = {
      productsTotal: (productsRes as any).data?.total ?? 0,
      customersTotal: (customersRes as any).data?.total ?? 0,
      stocksTotal: (stocksRes as any).data?.total ?? 0,
      belowMinimumTotal: Array.isArray(belowArr) ? belowArr.length : 0,
    };
  } catch (e) {
    console.error('Erro ao carregar contadores do dashboard:', e);
  } finally {
    loadingCounters.value = false;
  }
}

async function loadMovements() {
  const accountId = currentAccount.value?.id;
  if (!accountId) return;
  loadingCharts.value = true;
  loadingTable.value = true;
  try {
    const res = await reportsResource.getStockMovements({ account_id: accountId });
    const body = (
      res as { data?: { data?: StockMovementsReportItem[] } | StockMovementsReportItem[] }
    ).data;
    const arr = Array.isArray(body) ? body : body?.data;
    movementsData.value = Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error('Erro ao carregar movimentações:', e);
    movementsData.value = [];
  } finally {
    loadingCharts.value = false;
    loadingTable.value = false;
  }
}

async function loadDashboard() {
  await Promise.all([loadCounters(), loadMovements()]);
}

onMounted(() => {
  void loadDashboard();
});
</script>
