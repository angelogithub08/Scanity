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
      flat
      bordered
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
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
    default: false,
  },
});

const emit = defineEmits(['onRequest']);

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

function onRequest(props: any) {
  emit('onRequest', props);
}

defineExpose({
  setPagination,
});
</script>
