<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Novo Registro de Estoque</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form ref="formRef" @submit="handleSubmit">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="formData.quantity"
                label="Quantidade"
                type="number"
                bg-color="white"
                outlined
                lazy-rules
                :rules="[validation.requiredNumber]"
              />
            </div>
            <div class="col-12">
              <q-select
                v-model="formData.type"
                :options="typeOptions"
                label="Tipo"
                bg-color="white"
                outlined
                lazy-rules
                :rules="[validation.required]"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="formData.observation"
                label="Observação"
                bg-color="white"
                type="textarea"
                outlined
                rows="3"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" color="grey" v-close-popup />
        <q-btn flat label="Salvar" color="primary" @click="handleSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QForm, QDialog } from 'quasar';
import { reactive, ref, watch, computed } from 'vue';
import { useValidation } from 'src/composables/useValidation';
import type { StockRecord } from 'src/interfaces/stock-records';
import { useAuthStore } from 'src/stores/auth';
import { useAccountsStore } from 'src/stores/accounts';

interface Props {
  modelValue: boolean;
  stockId: string | null | undefined;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [data: Partial<StockRecord>];
}>();

const validation = useValidation();
const formRef = ref<InstanceType<typeof QForm>>();
const authStore = useAuthStore();
const accountsStore = useAccountsStore();
const dialogModel = ref(props.modelValue);

const formData = reactive<Partial<StockRecord>>({
  quantity: null,
  type: null,
  observation: null,
});

const typeOptions = ['ENTRADA', 'SAIDA'];

const currentAccount = computed(() => accountsStore.currentAccount);

watch(
  () => props.modelValue,
  (newVal) => {
    dialogModel.value = newVal;
    if (!newVal) resetForm();
  },
);

watch(dialogModel, (newVal) => {
  emit('update:modelValue', newVal);
});

function resetForm() {
  formData.quantity = null;
  formData.type = null;
  formData.observation = null;
  formRef.value?.resetValidation();
}

async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid) {
    emit('created', {
      ...formData,
      quantity: +(formData.quantity || 0),
      stock_id: props.stockId || null,
      user_id: authStore.currentUser?.id || null,
    });
    dialogModel.value = false;
    resetForm();
  }
}

defineExpose({
  formData,
});
</script>
