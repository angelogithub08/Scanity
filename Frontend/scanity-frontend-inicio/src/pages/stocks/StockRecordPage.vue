<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader
        title="Estoque"
        @back="back"
        @save="save"
        :save-permission="record.id ? 'STOCK_UPDATE' : 'STOCK_CREATE'"
      />
    </template>
    <template #content>
      <q-form ref="formRef" @submit="save">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="record.product_id"
              :options="productsOptions"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              label="Produto"
              bg-color="white"
              outlined
              clearable
              lazy-rules
              :rules="[validation.required]"
              :readonly="isEditMode"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="record.current_quantity"
              label="Quantidade Atual"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.requiredNumber]"
              :readonly="isEditMode"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="record.min_quantity"
              label="Quantidade Mínima"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.requiredNumber]"
              type="number"
            />
          </div>
        </div>
      </q-form>

      <div class="row q-mt-lg" v-if="isEditMode">
        <div class="col-12">
          <div class="row items-center q-mb-md">
            <div class="col">
              <div class="text-h6">Registros de Estoque</div>
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                label="Novo Registro"
                icon="add"
                @click="showCreateDialog = true"
              />
            </div>
          </div>
          <StockRecordsTable
            :rows="stockRecords"
            :columns="stockRecordsColumns"
            :loading="loadingStockRecords"
            ref="stockRecordsTableRef"
            @onRequest="onStockRecordsRequest"
          />
        </div>
      </div>
    </template>
  </DefaultPage>

  <CreateStockRecordDialog
    v-model="showCreateDialog"
    :stock-id="record.id || null"
    @created="handleStockRecordCreated"
  />
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { Stock } from 'src/interfaces/stocks';
import type { StockRecord } from 'src/interfaces/stock-records';
import { reactive, ref, onMounted, computed, watch } from 'vue';
import type { QTableColumn } from 'quasar';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import StockRecordsTable from 'src/components/stocks/StockRecordsTable.vue';
import CreateStockRecordDialog from 'src/components/stocks/CreateStockRecordDialog.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useStocksResource } from 'src/composables/api/useStocksResource';
import { useStockRecordsResource } from 'src/composables/api/useStockRecordsResource';
import { useAccountsStore } from 'src/stores/accounts';
import { useAuthStore } from 'src/stores/auth';
import { useProductsResource } from 'src/composables/api/useProductsResource';
import { useDate } from 'src/composables/useDate';
import type { Product } from 'src/interfaces/products';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useStocksResource();
const stockRecordsResource = useStockRecordsResource();
const accountsStore = useAccountsStore();
const authStore = useAuthStore();
const productsResource = useProductsResource();
const { datetimeToClient } = useDate();

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<Stock>>({
  id: null,
  product_id: null,
  current_quantity: null,
  min_quantity: null,
});

const productsOptions = ref<Partial<Product>[]>([]);
const stockRecords = ref<StockRecord[]>([]);
const loadingStockRecords = ref(false);
const showCreateDialog = ref(false);
const stockRecordsTableRef = ref<InstanceType<typeof StockRecordsTable>>();

interface Pagination {
  sortBy: string;
  descending: boolean;
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
}

interface RequestProp {
  pagination: Partial<Pagination>;
}

const stockRecordsPagination = ref<Pagination>({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 10,
});

const currentAccount = computed(() => accountsStore.currentAccount);
const isEditMode = computed(() => !!record.id);

const stockRecordsColumns = ref<QTableColumn[]>([
  {
    name: 'quantity',
    label: 'Quantidade',
    field: 'quantity',
    align: 'left',
  },
  {
    name: 'type',
    label: 'Tipo',
    field: 'type',
    align: 'left',
    format: (val: string) => (val === 'ENTRADA' ? 'Entrada' : 'Saída'),
  },
  {
    name: 'observation',
    label: 'Observação',
    field: 'observation',
    align: 'left',
  },
  {
    name: 'created_at',
    label: 'Criado em',
    field: 'created_at',
    align: 'left',
    format: (val: string) => datetimeToClient(val) || '',
  },
]);

async function back() {
  await router.push({ name: 'stocks' });
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();
      let response;
      const recordData = {
        ...record,
        min_quantity: +(record.min_quantity || 0),
        current_quantity: +(record.current_quantity || 0),
        account_id: currentAccount.value?.id,
      } as Partial<Stock>;

      if (record.id) {
        response = await resource.update(record.id.toString(), recordData);
      } else {
        response = await resource.create(recordData);
      }

      Object.assign(record, response.data);
      Notify.create({
        message: `Operação realizada com sucesso`,
        color: 'positive',
        icon: 'check',
      });

      if (record.id) {
        await loadStockRecords();
      }
    }
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

async function loadProducts() {
  try {
    const accountId = currentAccount.value?.id;
    if (accountId) {
      const response = await productsResource.list({ account_id: accountId });
      productsOptions.value = response.data;
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

async function onStockRecordsRequest(requestProp: RequestProp) {
  if (!record.id) return;

  loadingStockRecords.value = true;
  try {
    const response: any = await stockRecordsResource.findAll({
      page: requestProp.pagination.page,
      limit: requestProp.pagination.rowsPerPage,
      stock_id: record.id,
    });

    Object.assign(stockRecordsPagination.value, {
      rowsPerPage: response.data.limit,
      rowsNumber: response.data.total,
      page: response.data.page,
    });
    stockRecordsTableRef.value?.setPagination({ ...stockRecordsPagination.value });
    stockRecords.value = response.data.data as StockRecord[];
  } catch (error) {
    console.error('Erro ao carregar registros de estoque:', error);
    showError(error);
  } finally {
    loadingStockRecords.value = false;
  }
}

async function loadStockRecords() {
  if (!record.id) return;
  await onStockRecordsRequest({ pagination: stockRecordsPagination.value });
}

async function handleStockRecordCreated(data: Partial<StockRecord>) {
  try {
    Loading.show();
    const userId = authStore.currentUser?.id;
    const recordData: Partial<StockRecord> = {
      ...data,
      user_id: userId ? userId : null,
    };
    await stockRecordsResource.create(recordData);
    Notify.create({
      message: 'Registro criado com sucesso',
      color: 'positive',
      icon: 'check',
    });
    await loadStockRecords();
    const response = await resource.findById(record.id as string);
    Object.assign(record, response.data);
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

watch(
  () => record.id,
  async (newId) => {
    if (newId) {
      await loadStockRecords();
    }
  },
);

onMounted(async () => {
  await loadProducts();

  if (route.params.id) {
    try {
      Loading.show();
      const id = route.params.id as string;
      const response = await resource.findById(id);
      Object.assign(record, response.data);
      await loadStockRecords();
    } catch (error) {
      console.error(error);
      showError(error);
    } finally {
      Loading.hide();
    }
  }
});
</script>
