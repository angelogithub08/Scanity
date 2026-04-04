<template>
  <DefaultPage>
    <template #header>
      <ListPageHeader
        title="Estoques"
        @filtrate="filtrate"
        @add="add"
        add-permission="STOCK_CREATE"
      >
        <template #actions>
          <q-btn
            icon="swap_vert"
            label="Movimentação rápida"
            color="primary"
            outline
            class="q-ml-sm full-height"
            @click="quickMovementDialogRef?.open()"
          />
        </template>
      </ListPageHeader>
    </template>
    <template #content>
      <DefaultTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        ref="tableRef"
        delete-permission="STOCK_DELETE"
        @viewRecord="viewRecord"
        @deleteRecord="deleteRecord"
        @onRequest="onRequest"
      >
        <template #body-cell-copy_id="props">
          <q-td :props="props" style="padding: 0px; margin: 0px" width="1%">
            <q-btn
              flat
              dense
              round
              icon="content_copy"
              color="primary"
              @click="copyId(props.row.id)"
            />
          </q-td>
        </template>
        <template #body-cell-product_image="props">
          <q-td :props="props" style="padding: 0px; margin: 0px" width="1%">
            <q-img
              v-if="props.row.product_image"
              :src="props.row.product_image"
              ratio="1"
              width="50px"
              height="50px"
              class="rounded-borders"
              fit="contain"
            />
            <q-icon v-else name="image" size="24px" color="grey-6" />
          </q-td>
        </template>
      </DefaultTable>

      <QuickMovementDialog ref="quickMovementDialogRef" @success="filtrate" />
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import { Dialog, Loading, Notify } from 'quasar';
import { useRouter } from 'vue-router';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import ListPageHeader from 'src/components/shared/pages/ListPageHeader.vue';
import DefaultTable from 'src/components/shared/tables/DefaultTable.vue';
import QuickMovementDialog from 'src/components/stocks/QuickMovementDialog.vue';
import { useHandleException } from 'src/composables/useHandleException';
import { useStocksResource } from 'src/composables/api/useStocksResource';
import { useDate } from 'src/composables/useDate';
import { useAccountsStore } from 'src/stores/accounts';
import { useClipboard } from 'src/composables/useClipboard';

const router = useRouter();
const { showError } = useHandleException();
const resource = useStocksResource();
const { datetimeToClient } = useDate();
const accountsStore = useAccountsStore();
const { copyToClipboard } = useClipboard();

const tableRef = ref<InstanceType<typeof DefaultTable>>();
const quickMovementDialogRef = ref<InstanceType<typeof QuickMovementDialog>>();

const search = ref('');
const rows = ref([]);
const loading = ref(false);

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

const pagination = ref<Pagination>({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 10,
});

const columns = ref<QTableColumn[]>([
  { name: 'copy_id', label: 'ID', field: 'copy_id', align: 'center', style: 'width: 1%' },
  {
    name: 'product_image',
    label: 'Imagem',
    field: 'product_image',
    align: 'center',
    style: 'width: 1%',
  },
  { name: 'product_barcode', label: 'Código de Barras', field: 'product_barcode', align: 'left' },
  { name: 'product_name', label: 'Produto', field: 'product_name', align: 'left' },
  { name: 'current_quantity', label: 'Quantidade Atual', field: 'current_quantity', align: 'left' },
  { name: 'min_quantity', label: 'Quantidade Mínima', field: 'min_quantity', align: 'left' },
  {
    name: 'created_at',
    label: 'Criado em',
    field: 'created_at',
    align: 'left',
    format: (val: string) => datetimeToClient(val) || '',
  },
  {
    name: 'updated_at',
    label: 'Atualizado em',
    field: 'updated_at',
    align: 'left',
    format: (val: string) => datetimeToClient(val) || '',
  },
]);

const currentAccount = computed(() => {
  return accountsStore.currentAccount;
});

function copyId(id: string) {
  void copyToClipboard(id);
}

async function onRequest(requestProp: RequestProp) {
  loading.value = true;
  Loading.show();
  try {
    const response: any = await resource.findAll({
      page: requestProp.pagination.page,
      limit: requestProp.pagination.rowsPerPage,
      name: search.value,
      account_id: currentAccount.value?.id,
    });

    Object.assign(pagination.value, {
      rowsPerPage: response.data.limit,
      rowsNumber: response.data.total,
      page: response.data.page,
    });
    tableRef.value?.setPagination({ ...pagination.value });
    rows.value = response.data.data as [];
  } catch (error) {
    console.error(error);
    showError(error);
  } finally {
    loading.value = false;
    Loading.hide();
  }
}

async function filtrate(strSearch: string | null = null) {
  if (strSearch !== null) {
    search.value = strSearch;
  }
  await onRequest({ pagination: pagination.value });
}

async function add() {
  await router.push({ name: 'stock' });
}

async function viewRecord(record: any) {
  await router.push({ name: 'stock', params: { id: record.id } });
}

function deleteRecord(record: any) {
  Dialog.create({
    title: 'Excluir',
    html: true,
    message: `Tem certeza que deseja excluir este registro? <b>(${record.name})</b>`,
    ok: {
      label: 'Excluir',
      color: 'red-5',
    },
    cancel: {
      label: 'Cancelar',
      color: 'black',
      flat: true,
    },
  }).onOk(() => {
    Loading.show();
    resource
      .destroy(record.id)
      .then(() => filtrate())
      .then(() => {
        Notify.create({
          icon: 'check',
          message: 'Registro excluído com sucesso',
          color: 'green-5',
        });
        Loading.hide();
      })
      .catch((error) => {
        console.error(error);
        showError(error);
        Loading.hide();
      });
  });
}

onMounted(async () => {
  await onRequest({ pagination: pagination.value });
});
</script>
