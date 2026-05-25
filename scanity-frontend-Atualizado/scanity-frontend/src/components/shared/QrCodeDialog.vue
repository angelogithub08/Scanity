<template>
  <q-dialog v-model="dialogModel">
    <q-card style="min-width: 320px; max-width: 90vw">
      <q-card-section class="row items-center justify-between">
        <div class="text-weight-medium">QR Code</div>
        <q-btn flat dense round icon="close" v-close-popup />
      </q-card-section>
      <q-separator />

      <q-card-section>
        <div class="flex flex-center" style="min-height: 320px">
          <q-spinner v-if="qrDialogLoading" />
          <img
            v-else-if="qrDialogDataUrl"
            :src="qrDialogDataUrl"
            alt="QR Code"
            style="width: 100%; max-width: 320px; height: auto"
          />
          <div v-else class="text-grey-7">Código indisponível</div>
        </div>

        <div v-if="barcode" class="text-center q-mt-md text-grey-8" style="letter-spacing: 0.5px">
          {{ barcode }}
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat no-caps label="Cancelar" v-close-popup class="text-grey-8" />
        <q-btn
          color="primary"
          icon="download"
          no-caps
          label="Baixar QR code"
          :loading="downloadingQrPng"
          @click="handleDownloadQrPng"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useHandleException } from 'src/composables/useHandleException';
import { useBarcodePrint } from 'src/composables/useBarcodePrint';

interface Props {
  modelValue: boolean;
  title?: string | null | undefined;
  barcode?: string | null | undefined;
  /** Altura usada para gerar o QR (lado aproximado do QR) */
  qrHeight?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { showError } = useHandleException();

const { generateBarcodeDataUrlFromProps, downloadBarcodePng } = useBarcodePrint({
  height: props.qrHeight ?? 150,
});

const dialogModel = ref(props.modelValue);

const downloadingQrPng = ref(false);
const qrDialogLoading = ref(false);
const qrDialogDataUrl = ref<string | null>(null);

function resetDialog() {
  qrDialogLoading.value = false;
  qrDialogDataUrl.value = null;
  downloadingQrPng.value = false;
}

watch(
  () => props.modelValue,
  (newVal) => {
    dialogModel.value = newVal;
    if (newVal) void generateQr();
    else resetDialog();
  },
);

watch(dialogModel, (newVal) => {
  emit('update:modelValue', newVal);
});

async function generateQr() {
  if (!props.barcode) {
    qrDialogDataUrl.value = null;
    return;
  }

  qrDialogLoading.value = true;
  qrDialogDataUrl.value = null;

  try {
    qrDialogDataUrl.value = await generateBarcodeDataUrlFromProps({
      title: props.title,
      barcode: props.barcode,
    });
  } catch (error) {
    showError(error);
  } finally {
    qrDialogLoading.value = false;
  }
}

async function handleDownloadQrPng() {
  if (!props.barcode) return;

  downloadingQrPng.value = true;
  try {
    await downloadBarcodePng({ title: props.title ?? undefined, barcode: props.barcode });
  } catch (error) {
    showError(error);
  } finally {
    downloadingQrPng.value = false;
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

<style scoped lang="scss">
/* Sem estilos específicos por enquanto: layout usa classes do Quasar. */
</style>
