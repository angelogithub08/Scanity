<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader
        title="Inventário"
        @back="back"
        @save="save"
        :save-permission="record.id ? 'INVENTORY_UPDATE' : 'INVENTORY_CREATE'"
      >
        <template #prepend_buttons>
          <q-btn
            v-if="record.id && currentStockId"
            color="primary"
            label="Atualizar estoque"
            icon="refresh"
            @click="showCreateDialog = true"
          />
        </template>
      </RecordPageHeader>
    </template>
    <template #content>
      <q-form ref="formRef" @submit="save">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="record.product_id"
              :options="productOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Produto"
              bg-color="white"
              outlined
              use-input
              fill-input
              hide-selected
              clearable
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
          <div class="col-6 col-md-2">
            <q-input
              v-model="record.counted_quantity"
              label="Quantidade Contada"
              type="number"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.requiredNumber]"
            />
          </div>
          <div class="col-6 col-md-2">
            <div class="row no-wrap items-center">
              <q-input
                v-model="record.stock_quantity"
                type="number"
                label="Quantidade em Estoque"
                bg-color="white"
                outlined
                lazy-rules
                :rules="[validation.requiredNumber]"
                class="col"
                style="margin: 0; padding: 0"
              />
              <q-btn
                icon="refresh"
                round
                flat
                color="primary"
                :loading="loadingStock"
                :disable="!record.product_id"
                @click="fetchCurrentStock"
              >
                <q-tooltip>Consultar quantidade atual em estoque</q-tooltip>
              </q-btn>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="record.status"
              :options="statusOptions"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              label="Situação"
              bg-color="white"
              outlined
              use-input
              fill-input
              hide-selected
              clearable
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="record.observation"
              label="Observação"
              bg-color="white"
              outlined
              lazy-rules
            />
          </div>
        </div>
      </q-form>
    </template>
  </DefaultPage>

  <CreateStockRecordDialog
    v-model="showCreateDialog"
    :stock-id="currentStockId"
    @created="handleStockRecordCreated"
  />
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { InventoryCount } from 'src/interfaces/inventory-counts';
import type { StockRecord } from 'src/interfaces/stock-records';
import { reactive, ref, onMounted, computed, watch } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import CreateStockRecordDialog from 'src/components/stocks/CreateStockRecordDialog.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useInventoryCountsResource } from 'src/composables/api/useInventoryCountsResource';
import { useProductsResource } from 'src/composables/api/useProductsResource';
import { useStocksResource } from 'src/composables/api/useStocksResource';
import { useStockRecordsResource } from 'src/composables/api/useStockRecordsResource';
import { useAccountsStore } from 'src/stores/accounts';
import type { Product } from 'src/interfaces/products';
import { useUsersStore } from 'src/stores/users';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useInventoryCountsResource();
const productsResource = useProductsResource();
const stocksResource = useStocksResource();
const stockRecordsResource = useStockRecordsResource();
const accountsStore = useAccountsStore();
const usersStore = useUsersStore();

const formRef = ref<InstanceType<typeof QForm>>();
const productOptions = ref<{ value: string; label: string }[]>([]);
const loadingStock = ref(false);
const showCreateDialog = ref(false);
const currentStockId = ref<string | null>(null);
const statusOptions = [
  { id: 'CONFORME', name: 'Conforme' },
  { id: 'DIVERGENTE', name: 'Divergente' },
] as const;

const record = reactive<Partial<InventoryCount>>({
  id: null,
  product_id: null,
  counted_quantity: null,
  stock_quantity: null,
  status: null,
  observation: null,
  user_id: null,
});

const currentAccount = computed(() => accountsStore.currentAccount);
const currentUser = computed(() => usersStore.currentUser);

// altere o valor de record.status se a quantidade de stock contada for diferente da quantidade em estoque,
// se a quantidade de stock contada diferente da quantidade em estoque, o valor de record.status deve ser 'DIVERGENTE'
watch(
  () => record.counted_quantity,
  (newCountedQuantity) => {
    console.log(newCountedQuantity, record.stock_quantity);
    if (newCountedQuantity != record.stock_quantity) {
      record.status = 'DIVERGENTE';
    } else {
      record.status = 'CONFORME';
    }
  },
);
watch(
  () => record.stock_quantity,
  (newStockQuantity) => {
    if (newStockQuantity != record.counted_quantity) {
      record.status = 'DIVERGENTE';
    } else {
      record.status = 'CONFORME';
    }
  },
);

watch(
  () => record.product_id,
  async (newProductId) => {
    if (!newProductId) {
      currentStockId.value = null;
    } else {
      await resolveStockId();
    }
  },
);

async function resolveStockId() {
  if (!record.product_id) {
    currentStockId.value = null;
    return;
  }
  try {
    const { data } = await stocksResource.list({
      product_id: record.product_id,
    });
    const stocks = Array.isArray(data) ? data : [];
    currentStockId.value = stocks[0]?.id ?? null;
  } catch {
    currentStockId.value = null;
  }
}

async function handleStockRecordCreated(data: Partial<StockRecord>) {
  try {
    Loading.show();
    const recordData: Partial<StockRecord> = {
      ...data,
      user_id: currentUser.value?.id ?? null,
    };
    await stockRecordsResource.create(recordData);
    Notify.create({
      message: 'Registro de estoque criado com sucesso',
      color: 'positive',
      icon: 'check',
    });
    await fetchCurrentStock();
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

async function back() {
  await router.push({ name: 'inventory-counts' });
}

async function fetchCurrentStock() {
  if (!record.product_id) {
    Notify.create({
      message: 'Selecione um produto para consultar o estoque',
      color: 'warning',
      icon: 'warning',
    });
    return;
  }
  try {
    loadingStock.value = true;
    const { data } = await stocksResource.list({
      product_id: record.product_id,
    });
    const stocks = Array.isArray(data) ? data : [];
    const stock = stocks[0];
    record.stock_quantity = stock?.current_quantity ?? 0;
    currentStockId.value = stock?.id ?? null;
    Notify.create({
      message: stock
        ? `Estoque atual: ${record.stock_quantity}`
        : 'Nenhum registro de estoque encontrado para este produto',
      color: stock ? 'positive' : 'info',
      icon: stock ? 'inventory' : 'info',
    });
  } catch (error) {
    showError(error);
  } finally {
    loadingStock.value = false;
  }
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();
      let response;
      const recordData = {
        ...record,
        counted_quantity: Number(record.counted_quantity),
        stock_quantity: Number(record.stock_quantity),
        account_id: currentAccount.value?.id,
        user_id: currentUser.value?.id,
      } as Partial<InventoryCount>;

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
    }
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

onMounted(async () => {
  try {
    const { data: products } = await productsResource.list();
    productOptions.value = (products as Product[]).map((p) => ({
      value: p.id as string,
      label: p.name ?? '',
    }));
  } catch (error) {
    console.error(error);
    showError(error);
  }

  if (route.params.id) {
    try {
      Loading.show();
      const id = route.params.id as string;
      const response = await resource.findById(id);
      Object.assign(record, response.data);
      if (record.product_id) {
        await resolveStockId();
      }
    } catch (error) {
      console.error(error);
      showError(error);
    } finally {
      Loading.hide();
    }
  }
});
</script>
