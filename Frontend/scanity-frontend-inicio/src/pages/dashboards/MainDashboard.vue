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
          <counter-card title="Clientes" :value="0" icon="people" :loading="loadingCounters" />
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
            :value="0"
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
import { useStocksResource } from 'src/composables/api/useStocksResource';
import { useDate } from 'src/composables/useDate';

const accountsStore = useAccountsStore();
const productsResource = useProductsResource();
const stocksResource = useStocksResource();
const { datetimeToClient } = useDate();

const loadingCounters = ref(false);
const loadingCharts = ref(false);
const loadingTable = ref(false);

const dashboardData = ref({
  productsTotal: 0,
  stocksTotal: 0,
});

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
  return [
    { name: 'Entradas', data: [] },
    { name: 'Saídas', data: [] },
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
  return [];
});

async function loadCounters() {
  const accountId = currentAccount.value?.id;
  if (!accountId) return;
  loadingCounters.value = true;
  try {
    const [productsRes, stocksRes] = await Promise.all([
      productsResource.findAll({ page: 1, limit: 1, account_id: accountId }),
      stocksResource.findAll({ page: 1, limit: 1, account_id: accountId }),
    ]);
    dashboardData.value = {
      productsTotal: (productsRes as any).data?.total ?? 0,
      stocksTotal: (stocksRes as any).data?.total ?? 0,
    };
  } catch (e) {
    console.error('Erro ao carregar contadores do dashboard:', e);
  } finally {
    loadingCounters.value = false;
  }
}

async function loadDashboard() {
  await Promise.all([loadCounters()]);
}

onMounted(() => {
  void loadDashboard();
});
</script>
