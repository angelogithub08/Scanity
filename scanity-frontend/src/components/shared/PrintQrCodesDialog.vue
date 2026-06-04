<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card style="min-width: 380px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Imprimir QR Codes</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <p class="text-grey-8 q-mb-md">
          Informe quantas etiquetas QR deseja imprimir para
          <strong>{{ title }}</strong
          >.
        </p>

        <q-input
          ref="quantityInputRef"
          v-model.number="quantity"
          label="Quantidade de etiquetas"
          type="number"
          :min="1"
          :max="maxQuantity"
          bg-color="white"
          outlined
          lazy-rules
          :rules="[
            (val: number | null | undefined) =>
              (val != null && val > 0) || 'Informe uma quantidade',
            (val: number | null | undefined) =>
              (val != null && props.maxQuantity != null && val <= props.maxQuantity) ||
              `Máximo ${props.maxQuantity}`,
          ]"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" color="grey" v-close-popup />
        <q-btn
          color="primary"
          icon="print"
          label="Imprimir"
          :loading="printing"
          @click="handlePrint"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { QInput } from 'quasar';
import { useBarcodePrint } from 'src/composables/useBarcodePrint';

interface Props {
  modelValue: boolean;
  title?: string | null;
  barcode?: string | null;
  /** Quantidade sugerida (default) */
  defaultQuantity?: number;
  /** Quantidade máxima permitida */
  maxQuantity?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: null,
  barcode: null,
  defaultQuantity: 1,
  maxQuantity: 999,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { printMultipleBarcodesGrid } = useBarcodePrint();

const dialogModel = ref(props.modelValue);
const quantity = ref(props.defaultQuantity);
const printing = ref(false);
const quantityInputRef = ref<InstanceType<typeof QInput>>();

watch(
  () => props.modelValue,
  (newVal) => {
    dialogModel.value = newVal;
    if (newVal) {
      quantity.value = props.defaultQuantity;
    }
  },
);

watch(dialogModel, (newVal) => {
  emit('update:modelValue', newVal);
});

async function handlePrint() {
  if (!props.barcode) return;

  const valid = await quantityInputRef.value?.validate();
  if (!valid) return;

  printing.value = true;
  try {
    await printMultipleBarcodesGrid({ title: props.title, barcode: props.barcode }, quantity.value);
    dialogModel.value = false;
  } catch (error) {
    console.error('Erro ao imprimir QR codes:', error);
  } finally {
    printing.value = false;
  }
}

defineExpose({
  open: () => {
    emit('update:modelValue', true);
  },
  close: () => {
    emit('update:modelValue', false);
  },
});
</script>
