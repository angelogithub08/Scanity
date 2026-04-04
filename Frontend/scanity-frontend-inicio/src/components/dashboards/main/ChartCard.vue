<template>
  <q-card class="chart-card" flat bordered>
    <q-card-section>
      <div class="text-h6 q-mb-md">{{ title }}</div>
      <div v-if="loading" class="flex flex-center" style="height: 280px">
        <q-spinner-dots color="primary" size="2.5rem" />
      </div>
      <apexchart
        v-else
        height="280"
        :type="type"
        :options="chartOptions"
        :series="series"
      ></apexchart>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    type: string;
    chartOptions: Record<string, unknown>;
    series: unknown[];
    loading?: boolean;
  }>(),
  { loading: false },
);
</script>

<style scoped>
.chart-card {
  height: 100%;
}
</style>
