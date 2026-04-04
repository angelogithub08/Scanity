<template>
  <div class="row items-center justify-between">
    <div class="col-12 col-sm-4 col-md-auto">
      <div class="row items-center">
        <div class="text-h6">{{ title }}</div>
        <slot name="after-title" />
      </div>
    </div>
    <div class="col-12 col-sm-8 col-md-auto row justify-end">
      <div class="row justify-end">
        <template v-if="showSearchInput">
          <q-input
            v-model="search"
            @keyup.enter="filtrate"
            placeholder="Pesquisar"
            outlined
            dense
            bg-color="white"
            class="col-grow"
          >
            <template v-slot:append>
              <q-btn icon="search" @click="filtrate" dense flat round />
            </template>
          </q-input>
        </template>
        <template v-if="showAddButton">
          <div v-if="addPermission" class="inline">
            <q-btn
              icon="add"
              @click="add"
              color="primary"
              label="Novo"
              class="q-ml-sm full-height"
              unelevated
            />
          </div>
          <q-btn
            v-else
            icon="add"
            @click="add"
            color="primary"
            label="Novo"
            class="q-ml-sm"
            unelevated
          />
        </template>
      </div>
      <div class="row items-center">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps({
  title: {
    type: String,
    required: true,
  },
  showAddButton: {
    type: Boolean,
    default: true,
  },
  showSearchInput: {
    type: Boolean,
    default: true,
  },
  /** Permissão para exibir o botão Novo (ex: 'USERS_CREATE'). Se não informado, o botão é exibido. */
  addPermission: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(['filtrate', 'add']);

const search = ref('');

function filtrate() {
  emit('filtrate', search.value);
}

function add() {
  emit('add');
}
</script>
