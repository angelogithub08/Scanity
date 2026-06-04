<template>
  <q-card class="table-card" flat bordered>
    <q-card-section>
      <div class="text-h6 q-mb-md">{{ title }}</div>
      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner-dots color="primary" size="2.5rem" />
      </div>
      <q-table
        v-else
        :rows="rows"
        :columns="columns"
        row-key="_rowKey"
        :pagination="{ rowsPerPage: 5 }"
        flat
        dense
      >
        <template v-slot:body-cell-type="props">
          <q-td :props="props">
            <q-chip :color="getTypeColor(props.value)" text-color="white" dense size="sm">
              {{
                props.value === 'ENTRADA'
                  ? 'Entrada'
                  : props.value === 'SAIDA'
                    ? 'Saída'
                    : props.value
              }}
            </q-chip>
          </q-td>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    rows: Record<string, unknown>[];
    columns: {
      name: string;
      label: string;
      field: string;
      sortable?: boolean;
      align?: 'left' | 'right' | 'center';
    }[];
    loading?: boolean;
  }>(),
  { loading: false },
);

function getTypeColor(type: string) {
  if (type === 'ENTRADA') return 'positive';
  if (type === 'SAIDA') return 'warning';
  return 'grey';
}
</script>

<style scoped>
.table-card {
  height: 100%;
}
</style>
