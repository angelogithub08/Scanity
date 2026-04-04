<template>
  <q-btn icon="more_vert" round flat dense>
    <q-menu>
      <q-list dense separator>
        <q-item @click="emit('view', record)" clickable v-close-popup>
          <q-item-section avatar>
            <q-avatar>
              <q-icon name="visibility" />
            </q-avatar>
          </q-item-section>
          <q-item-section>Visualizar</q-item-section>
        </q-item>
        <slot name="middle-options"></slot>
        <q-item
          v-if="deletePermission"
          class="bg-red-5 text-white"
          @click="emit('delete', record)"
          clickable
          v-close-popup
        >
          <q-item-section avatar>
            <q-avatar>
              <q-icon name="delete" />
            </q-avatar>
          </q-item-section>
          <q-item-section>Excluir</q-item-section>
        </q-item>
        <q-item
          v-else
          class="bg-red-5 text-white"
          @click="emit('delete', record)"
          clickable
          v-close-popup
        >
          <q-item-section avatar>
            <q-avatar>
              <q-icon name="delete" />
            </q-avatar>
          </q-item-section>
          <q-item-section>Excluir</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
defineProps<{
  record: any;
  /** Permissão para exibir a opção Excluir (ex: 'USERS_DELETE'). Se não informado, a opção é exibida. */
  deletePermission?: string;
}>();

const emit = defineEmits<{
  (e: 'view', record: any): void;
  (e: 'delete', record: any): void;
}>();
</script>
