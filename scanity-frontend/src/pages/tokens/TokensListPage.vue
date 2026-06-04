<template>
  <DefaultPage>
    <template #header>
      <ListPageHeader title="Tokens" @filtrate="filtrate" @add="add" add-permission="TOKENS_CREATE">
        <template #after-title> </template>
      </ListPageHeader>
    </template>
    <template #content>
      <q-table
        :rows-per-page-options="[5, 10, 20, 30, 40, 50]"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        v-model:pagination="pagination"
        row-key="id"
        ref="tableRef"
        @request="onRequest"
        binary-state-sort
        :dense="q.screen.lt.sm"
      >
        <template v-slot:body-cell-revoked_at="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.revoked_at ? 'negative' : 'positive'"
              :label="props.row.revoked_at ? 'Revogado' : 'Ativo'"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-copy_id="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              round
              icon="content_copy"
              color="primary"
              @click="copyId(props.row.id)"
            >
              <q-tooltip>Copiar ID</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="!props.row.revoked_at"
              flat
              dense
              round
              icon="block"
              color="negative"
              @click="revokeToken(props.row)"
            >
              <q-tooltip>Revogar Token</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="content_copy"
              color="primary"
              @click="copyToken(props.row.token)"
            >
              <q-tooltip>Copiar Token</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>

      <LeadsApiPublicDialog ref="apiDialogRef" :account-id="currentAccount?.id || undefined" />
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import { Dialog, Loading, Notify, useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import ListPageHeader from 'src/components/shared/pages/ListPageHeader.vue';
import { useHandleException } from 'src/composables/useHandleException';
import { useTokensResource } from 'src/composables/api/useTokensResource';
import { useDate } from 'src/composables/useDate';
import { useAccountsStore } from 'src/stores/accounts';
import { useClipboard } from 'src/composables/useClipboard';
import type DefaultTable from 'src/components/shared/tables/DefaultTable.vue';

const q = useQuasar();
const router = useRouter();
const { showError } = useHandleException();
const resource = useTokensResource();
const { datetimeToClient } = useDate();
const accountsStore = useAccountsStore();
const { copyToClipboard } = useClipboard();

const search = ref('');
const rows = ref([]);
const loading = ref(false);

const tableRef = ref<InstanceType<typeof DefaultTable>>();

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
  { name: 'token', label: 'Token', field: 'token', align: 'left' },
  {
    name: 'user_name',
    label: 'Usuário',
    field: 'user_name',
    align: 'left',
    format: (val: string) => val || '-',
  },
  {
    name: 'revoked_at',
    label: 'Status',
    field: 'revoked_at',
    align: 'left',
    format: (val: string) => (val ? 'Revogado' : 'Ativo'),
  },
  {
    name: 'created_at',
    label: 'Criado em',
    field: 'created_at',
    align: 'left',
    format: (val: string) => datetimeToClient(val) || '',
  },
  {
    name: 'actions',
    label: 'Ações',
    field: 'actions',
    align: 'center',
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
      account_id: currentAccount.value?.id,
      type: 'ACCESS_TOKEN', // Filtrar apenas tokens do tipo ACCESS_TOKEN
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
  await router.push({ name: 'token' });
}

function copyId(id: string) {
  void copyToClipboard(id);
}

// Revogar token imediatamente
function revokeToken(record: any) {
  Dialog.create({
    title: 'Revogar Token',
    message: 'Tem certeza que deseja revogar este token? Esta ação não pode ser revertida.',
    ok: {
      label: 'Revogar',
      color: 'negative',
      unelevated: true,
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7',
    },
    persistent: false,
  }).onOk(() => {
    void (async () => {
      try {
        Loading.show({ message: 'Revogando token...' });
        await resource.update(record.id, {
          revoked_at: new Date().toISOString(),
        });

        Notify.create({
          type: 'positive',
          message: 'Token revogado com sucesso!',
          icon: 'check',
        });

        await filtrate();
      } catch (error) {
        console.error(error);
        showError(error);
      } finally {
        Loading.hide();
      }
    })();
  });
}

// Copiar token para clipboard
function copyToken(token: string) {
  void copyToClipboard(token);
  Notify.create({
    type: 'positive',
    message: 'Token copiado para a área de transferência!',
    icon: 'content_copy',
  });
}

onMounted(async () => {
  await onRequest({ pagination: pagination.value });
});
</script>
