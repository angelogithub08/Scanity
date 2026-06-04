<template>
  <DefaultPage>
    <template #header>
      <ListPageHeader
        title="Inventário"
        @filtrate="filtrate"
        @add="add"
        add-permission="INVENTORY_CREATE"
      />
    </template>
    <template #content>
      <DefaultTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        ref="tableRef"
        delete-permission="INVENTORY_DELETE"
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
      </DefaultTable>
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import { Dialog, Loading, Notify } from 'quasar';
import { useRouter } from 'vue-router';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import ListPageHeader from 'src/components/shared/pages/ListPageHeader.vue';
import DefaultTable from 'src/components/shared/tables/DefaultTable.vue';
import { useHandleException } from 'src/composables/useHandleException';
import { useInventoryCountsResource } from 'src/composables/api/useInventoryCountsResource';
import { useDate } from 'src/composables/useDate';
import { useAccountsStore } from 'src/stores/accounts';
import { useClipboard } from 'src/composables/useClipboard';

const router = useRouter();
const { showError } = useHandleException();
const resource = useInventoryCountsResource();
const { datetimeToClient } = useDate();
const accountsStore = useAccountsStore();
const { copyToClipboard } = useClipboard();

const tableRef = ref<InstanceType<typeof DefaultTable>>();

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
  { name: 'product_name', label: 'Produto', field: 'product_name', align: 'left' },
  {
    name: 'counted_quantity',
    label: 'Quantidade Contada',
    field: 'counted_quantity',
    align: 'left',
  },
  {
    name: 'stock_quantity',
    label: 'Quantidade em Estoque',
    field: 'stock_quantity',
    align: 'left',
  },
  { name: 'status', label: 'Situação', field: 'status', align: 'left' },
  { name: 'observation', label: 'Observação', field: 'observation', align: 'left' },
  { name: 'user_name', label: 'Usuário', field: 'user_name', align: 'left' },
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

async function onRequest(requestProp: RequestProp) {
  loading.value = true;
  Loading.show();
  try {
    const response: any = await resource.findAll({
      page: requestProp.pagination.page,
      limit: requestProp.pagination.rowsPerPage,
      name: search.value,
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
  await router.push({ name: 'inventory-count' });
}

async function viewRecord(record: any) {
  await router.push({ name: 'inventory-count', params: { id: record.id } });
}

function copyId(id: string) {
  void copyToClipboard(id);
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
