<template>
  <div class="row items-center justify-between">
    <div class="col-12 col-sm-4 col-md-6">
      <div>
        <span class="text-h6">{{ title }}</span> <slot name="after-title"></slot>
      </div>
    </div>
    <div class="col-12 col-sm-8 col-md-6">
      <div class="fit row wrap">
        <slot name="actions">
          <div class="fit row wrap justify-end">
            <slot name="prepend_buttons" />
            <q-btn
              v-if="showBackButton"
              @click="$emit('back')"
              icon="arrow_back"
              color="primary"
              label="Voltar"
              class="q-ml-sm"
              flat
            />
            <template v-if="showSaveButton">
              <div v-if="savePermission" class="inline">
                <q-btn
                  @click="$emit('save')"
                  icon="check"
                  color="primary"
                  label="Salvar"
                  class="q-ml-sm"
                  unelevated
                />
              </div>
              <q-btn
                v-else
                @click="$emit('save')"
                icon="check"
                color="primary"
                label="Salvar"
                class="q-ml-sm"
                unelevated
              />
            </template>
            <slot name="append_buttons" />
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  showBackButton: {
    type: Boolean,
    default: true,
  },
  showSaveButton: {
    type: Boolean,
    default: true,
  },
  /** Permissão para exibir o botão Salvar (ex: 'USERS_UPDATE' ou 'USERS_CREATE'). Se não informado, o botão é exibido. */
  savePermission: {
    type: [String, Array] as unknown as () => string | string[] | undefined,
    default: undefined,
  },
});

defineEmits(['back', 'save']);
</script>
