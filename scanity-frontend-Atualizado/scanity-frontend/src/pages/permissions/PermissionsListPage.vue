<template>
  <DefaultPage>
    <template #outside-card>
      <q-breadcrumbs class="q-mb-md">
        <q-breadcrumbs-el label="Home" to="/" />
        <q-breadcrumbs-el label="Permissões" />
      </q-breadcrumbs>
    </template>
    <template #header>
      <ListPageHeader
        title="Permissões"
        @filtrate="filtrate"
        @add="add"
        add-permission="PERMISSIONS_CREATE"
      />
    </template>
    <template #content>
      <DefaultTable
        ref="tableRef"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        delete-permission="PERMISSIONS_DELETE"
        row-clickable
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
import { usePermissionsResource } from 'src/composables/api/usePermissionsResource';
import { useAccountsStore } from 'src/stores/accounts';
import { useClipboard } from 'src/composables/useClipboard';

const router = useRouter();
const { showError } = useHandleException();
const resource = usePermissionsResource();
const accountsStore = useAccountsStore();
const { copyToClipboard } = useClipboard();

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

const pagination = reactive<Pagination>({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 10,
});

const columns = ref<QTableColumn[]>([
  { name: 'copy_id', label: 'ID', field: 'copy_id', align: 'center', style: 'width: 1%' },
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'key_group', label: 'Key Group', field: 'key_group', align: 'left' },
  { name: 'key', label: 'Key', field: 'key', align: 'left' },
  { name: 'created_at', label: 'Criado em', field: 'created_at', align: 'left' },
  { name: 'updated_at', label: 'Atualizado em', field: 'updated_at', align: 'left' },
]);

const tableRef = ref<InstanceType<typeof DefaultTable>>();

const currentAccount = computed(() => {
  return accountsStore.currentAccount?.id;
});

async function onRequest(requestProp: RequestProp) {
  loading.value = true;
  Loading.show();
  try {
    const response: any = await resource.findAll({
      page: requestProp.pagination.page,
      limit: requestProp.pagination.rowsPerPage,
      name: search.value,
      account_id: currentAccount.value,
    });

    Object.assign(pagination, {
      rowsPerPage: response.data.limit,
      rowsNumber: response.data.total,
      page: response.data.page,
    });
    rows.value = response.data.data as [];

    tableRef.value?.setPagination({ ...pagination });
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
  await onRequest({ pagination });
}

async function add() {
  await router.push({ name: 'permission' });
}

async function viewRecord(record: any) {
  await router.push({ name: 'permission', params: { id: record.id } });
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
  await onRequest({ pagination });
});
</script>
