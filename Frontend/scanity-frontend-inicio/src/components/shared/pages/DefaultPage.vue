<template>
  <q-page padding>
    <q-card class="bg-grey-1" flat bordered>
      <q-card-section v-if="showHeader">
        <slot name="header"></slot>
      </q-card-section>
      <q-card-section>
        <slot name="content"></slot>
      </q-card-section>
    </q-card>

    <div v-if="$slots['additional-content']" class="q-mt-md">
      <q-card class="bg-grey-1" flat bordered>
        <slot name="additional-content"></slot>
      </q-card>
    </div>
  </q-page>
  <div class="col-12 text-right q-mt-md">
    <slot name="filters"></slot>
  </div>
</template>

<script setup lang="ts">
defineProps({
  showHeader: {
    type: Boolean,
    default: true,
  },
});
</script>
