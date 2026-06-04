<template>
  <DefaultPage>
    <template #header>
      <ListPageHeader
        title="Fornecedores"
        @filtrate="filtrate"
        @add="add"
        add-permission="SUPLIERS_CREATE"
      />
    </template>
    <template #content>
      <DefaultTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        ref="tableRef"
        delete-permission="SUPLIERS_DELETE"
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
import type { QTableColumn } from 'quasar';
import { Dialog, Loading, Notify } from 'quasar';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import ListPageHeader from 'src/components/shared/pages/ListPageHeader.vue';
import DefaultTable from 'src/components/shared/tables/DefaultTable.vue';
import { useSupliersResource } from 'src/composables/api/useSupliersResource';
import { useDate } from 'src/composables/useDate';
import { useHandleException } from 'src/composables/useHandleException';
import { useMask } from 'src/composables/useMask';
import { useAccountsStore } from 'src/stores/accounts';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from 'src/composables/useClipboard';

const router = useRouter();
const { showError } = useHandleException();
const resource = useSupliersResource();
const { datetimeToClient } = useDate();
const accountsStore = useAccountsStore();
const { applyMask } = useMask();
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
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  {
    name: 'phone',
    label: 'Telefone',
    field: 'phone',
    align: 'left',
    format: (val: string) => applyMask(val, 'phone'),
  },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'responsible_name', label: 'Responsável', field: 'responsible_name', align: 'left' },
  { name: 'observations', label: 'Observações', field: 'observations', align: 'left' },
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
  await router.push({ name: 'suplier' });
}

async function viewRecord(record: any) {
  await router.push({ name: 'suplier', params: { id: record.id } });
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
