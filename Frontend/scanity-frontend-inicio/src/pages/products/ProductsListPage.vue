<template>
  <DefaultPage>
    <template #header>
      <ListPageHeader
        title="Produtos"
        @filtrate="filtrate"
        @add="add"
        add-permission="PRODUCTS_CREATE"
      />
    </template>
    <template #content>
      <DefaultTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        ref="tableRef"
        delete-permission="PRODUCTS_DELETE"
        @viewRecord="viewRecord"
        @deleteRecord="deleteRecord"
        @onRequest="onRequest"
      >
        <template #body-cell-qr="props">
          <q-td :props="props" style="padding: 0px; margin: 0px" width="1%">
            <q-btn
              flat
              dense
              round
              icon="qr_code_2"
              color="primary"
              @click="handleOpenQrDialog(props.row)"
            />
          </q-td>
        </template>
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
        <template #body-cell-image="props">
          <q-td :props="props" style="padding: 0px; margin: 0px" width="1%">
            <q-img
              v-if="props.row.image"
              :src="props.row.image"
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

      <QrCodeDialog
        v-model="qrDialogOpen"
        :title="qrDialogTitle"
        :barcode="qrDialogBarcode"
        :qr-height="150"
      />
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
import { useProductsResource } from 'src/composables/api/useProductsResource';
import { useDate } from 'src/composables/useDate';
import { useCurrency } from 'src/composables/useCurrency';
import { useAccountsStore } from 'src/stores/accounts';
import { useClipboard } from 'src/composables/useClipboard';
import QrCodeDialog from 'src/components/shared/QrCodeDialog.vue';

const tableRef = ref<InstanceType<typeof DefaultTable>>();

const { copyToClipboard } = useClipboard();
const router = useRouter();
const { showError } = useHandleException();
const resource = useProductsResource();
const { datetimeToClient } = useDate();
const { formatCurrency } = useCurrency();
const accountsStore = useAccountsStore();

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
  { name: 'qr', label: 'QR Code', field: 'qr', align: 'center', style: 'width: 1%' },
  { name: 'copy_id', label: 'ID', field: 'copy_id', align: 'center', style: 'width: 1%' },
  { name: 'image', label: 'Imagem', field: 'image', align: 'center', style: 'width: 1%' },
  { name: 'barcode', label: 'Código de Barras', field: 'barcode', align: 'left' },
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  {
    name: 'value',
    label: 'Valor',
    field: 'value',
    align: 'left',
    format: (val: number) => formatCurrency(val) || 'R$ 0,00',
  },
  { name: 'category_name', label: 'Categoria', field: 'category_name', align: 'left' },
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

const qrDialogOpen = ref(false);
const qrDialogTitle = ref<string | null>(null);
const qrDialogBarcode = ref<string | null>(null);

function handleOpenQrDialog(record: any) {
  qrDialogTitle.value = record.name ?? null;
  qrDialogBarcode.value = record.barcode ?? null;
  qrDialogOpen.value = true;
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
  await router.push({ name: 'product' });
}

async function viewRecord(record: any) {
  await router.push({ name: 'product', params: { id: record.id } });
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

function copyId(id: string) {
  void copyToClipboard(id);
}

onMounted(async () => {
  await onRequest({ pagination: pagination.value });
});
</script>
