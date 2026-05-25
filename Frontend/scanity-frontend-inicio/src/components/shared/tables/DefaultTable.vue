<template>
  <div>
    <q-table
      :rows-per-page-options="[5, 10, 20, 30, 40, 50]"
      :rows="rows"
      :columns="columns"
      row-key="id"
      v-model:pagination="pagination"
      :loading="loading"
      binary-state-sort
      @request="onRequest"
      :dense="q.screen.lt.sm"
    >
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th auto-width v-if="showRecordMenu" />
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width v-if="showRecordMenu">
            <RecordMenu
              @view="viewRecord"
              @delete="deleteRecord"
              :record="props.row"
              :delete-permission="deletePermission"
            >
              <template #middle-options>
                <slot name="record-menu-options" :record="props.row" />
              </template>
            </RecordMenu>
          </q-td>
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            @click="handleRowClick(props.row)"
            :class="rowClickable ? 'cursor-pointer' : ''"
          >
            <slot
              :name="`body-cell-${col.name}`"
              :props="props"
              :value="col.value"
              :row="props.row"
              :col="col"
            >
              <span v-html="col.value"></span>
            </slot>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { PropType } from 'vue';
import { ref } from 'vue';
import RecordMenu from './RecordMenu.vue';

interface Pagination {
  sortBy: string;
  descending: boolean;
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
}

const props = defineProps({
  rows: {
    type: Array as PropType<any[]>,
    required: true,
  },
  columns: {
    type: Array as PropType<any[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  showRecordMenu: {
    type: Boolean,
    default: true,
  },
  /** Permissão para exibir o botão Excluir no menu do registro (ex: 'USERS_DELETE'). Se não informado, o botão é exibido. */
  deletePermission: {
    type: String,
    default: undefined,
  },
  rowClickable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['viewRecord', 'deleteRecord', 'onRequest']);
const q = useQuasar();

const pagination = ref<Pagination>({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 10,
});

function setPagination(paginationData: Pagination) {
  pagination.value = { ...paginationData };
}

function viewRecord(record: any) {
  emit('viewRecord', record);
}

function deleteRecord(record: any) {
  emit('deleteRecord', record);
}

function onRequest(props: any) {
  emit('onRequest', props);
}

function handleRowClick(row: any) {
  if (props.rowClickable) {
    viewRecord(row);
  }
}

defineExpose({
  setPagination,
});
</script>
