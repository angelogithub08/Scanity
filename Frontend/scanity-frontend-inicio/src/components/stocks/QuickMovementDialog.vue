<template>
  <q-dialog v-model="dialogOpen" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Movimentação rápida</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input
          ref="barcodeInputRef"
          v-model="barcode"
          label="Código do produto (QR)"
          bg-color="white"
          outlined
          dense
          autofocus
          :loading="loading"
          class="q-mb-md"
          @keydown.enter.prevent="submitQuickMovement"
        >
          <template #append>
            <q-btn
              icon="send"
              dense
              flat
              round
              color="primary"
              :loading="loading"
              @click="submitQuickMovement"
            />
          </template>
        </q-input>

        <q-toggle
          v-model="qrScannerEnabled"
          class="q-mb-sm"
          label="Leitor de QR Code"
          color="primary"
        />

        <div v-if="qrScannerEnabled" class="qr-scanner-container q-mb-md">
          <qrcode-stream
            :key="qrScannerInstanceKey"
            :paused="qrScannerPaused"
            class="qr-scanner-video"
            @detect="onQrDetect"
            @error="onQrError"
          />
        </div>

        <div v-if="qrScannerError" class="text-caption text-negative q-mb-md">
          {{ qrScannerError }}
        </div>
        <div v-if="qrCooldownSeconds > 0" class="text-caption text-grey-7 q-mb-md">
          Aguardando {{ qrCooldownSeconds }}s para a próxima leitura...
        </div>

        <q-option-group v-model="movementType" :options="movementTypeOptions" type="radio" inline />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Fechar" color="grey" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, watch, computed, onMounted, onUnmounted } from 'vue';
import type { QInput } from 'quasar';
import { Notify } from 'quasar';
import { QrcodeStream } from 'vue-qrcode-reader';
import { useHandleException } from 'src/composables/useHandleException';
import { useStocksResource } from 'src/composables/api/useStocksResource';
import { useAccountsStore } from 'src/stores/accounts';

const emit = defineEmits<{
  success: [];
}>();

const { showError } = useHandleException();
const stocksResource = useStocksResource();
const accountsStore = useAccountsStore();

const dialogOpen = ref(false);
const movementType = ref<'ENTRADA' | 'SAIDA'>('ENTRADA');
const movementTypeOptions = [
  { value: 'ENTRADA' as const, label: 'Entrada' },
  { value: 'SAIDA' as const, label: 'Saída' },
];
const movementStageId = ref<string | null>(null);
const barcode = ref('');
const loading = ref(false);
const barcodeInputRef = ref<InstanceType<typeof QInput> | null>(null);
const qrScannerError = ref<string | null>(null);
const qrScannerPaused = ref(false);
const qrScannerBusy = ref(false);
const qrScannerInstanceKey = ref(0);
const qrScannerEnabled = ref(false);
const qrCooldownSeconds = ref(0);
const qrCooldownTimerId = ref<number | null>(null);

const currentAccount = computed(() => accountsStore.currentAccount);

watch(dialogOpen, (open) => {
  if (open) {
    movementType.value = 'ENTRADA';
    movementStageId.value = null;
    barcode.value = '';
    qrScannerError.value = null;
    qrScannerPaused.value = false;
    qrScannerBusy.value = false;
    qrCooldownSeconds.value = 0;
    clearQrCooldownTimer();
    qrScannerInstanceKey.value += 1;
    void nextTick(() => barcodeInputRef.value?.focus());
  }
});

watch(qrScannerEnabled, (enabled) => {
  qrScannerError.value = null;
  if (!enabled) {
    qrScannerPaused.value = true;
    qrScannerBusy.value = false;
    qrCooldownSeconds.value = 0;
    clearQrCooldownTimer();
    return;
  }

  qrScannerPaused.value = false;
  qrScannerInstanceKey.value += 1;
});

onUnmounted(() => {
  clearQrCooldownTimer();
});

function clearQrCooldownTimer() {
  if (!qrCooldownTimerId.value) return;
  window.clearInterval(qrCooldownTimerId.value);
  qrCooldownTimerId.value = null;
}

async function waitForNextScanCooldown(seconds: number) {
  clearQrCooldownTimer();
  qrCooldownSeconds.value = seconds;

  await new Promise<void>((resolve) => {
    qrCooldownTimerId.value = window.setInterval(() => {
      qrCooldownSeconds.value -= 1;
      if (qrCooldownSeconds.value <= 0) {
        clearQrCooldownTimer();
        resolve();
      }
    }, 1000);
  });
}

async function onQrDetect(detectedCodes: Array<{ rawValue?: string }>) {
  if (!qrScannerEnabled.value) return;
  if (qrScannerBusy.value) return;

  const rawValue = detectedCodes?.[0]?.rawValue;
  if (!rawValue) return;

  qrScannerBusy.value = true;
  qrScannerPaused.value = true;
  barcode.value = String(rawValue);

  try {
    await submitQuickMovement();
    await waitForNextScanCooldown(3);
  } finally {
    barcode.value = '';
    qrScannerBusy.value = false;
    qrScannerPaused.value = false;
    qrCooldownSeconds.value = 0;
    clearQrCooldownTimer();
    qrScannerInstanceKey.value += 1;
  }
}

function onQrError(error: unknown) {
  qrScannerError.value =
    (error as { message?: string })?.message ?? 'Não foi possível iniciar a câmera.';
}

async function submitQuickMovement() {
  const barcodeTrimmed = barcode.value?.trim();
  if (!barcodeTrimmed) return;

  loading.value = true;
  try {
    await stocksResource.quickMovement({
      barcode: barcodeTrimmed,
      type: movementType.value,
    });

    Notify.create({
      icon: 'check',
      message: 'Movimentação registrada com sucesso',
      color: 'green-5',
    });

    barcode.value = '';
    emit('success');
    await nextTick();
    barcodeInputRef.value?.focus();
  } catch (error) {
    console.error(error);
    showError(error);
  } finally {
    loading.value = false;
  }
}

defineExpose({
  open: () => (dialogOpen.value = true),
  close: () => (dialogOpen.value = false),
});
</script>

<style scoped lang="scss">
.qr-scanner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px;
}

.qr-scanner-video {
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: #000;
  object-fit: cover;
}
</style>
