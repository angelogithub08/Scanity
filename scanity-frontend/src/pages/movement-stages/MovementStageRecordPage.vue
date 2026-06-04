<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader title="Etapa De Movimento" @back="back" @save="save" />
    </template>
    <template #content>
      <q-form ref="formRef" @submit="save">
        <q-banner v-if="!record.id" class="bg-primary text-white q-mb-md rounded-borders">
          <template #avatar>
            <q-icon name="info" />
          </template>
          Ao cadastrar uma nova etapa, serão gerados automaticamente dois registros:
          <strong>"Entrada [nome]"</strong> e <strong>"Saída [nome]"</strong>.
        </q-banner>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-input
              v-model="record.name"
              label="Nome"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
        </div>
      </q-form>
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { MovementStage } from 'src/interfaces/movement-stages';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useMovementStagesResource } from 'src/composables/api/useMovementStagesResource';
import { useAccountsStore } from 'src/stores/accounts';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useMovementStagesResource();
const accountsStore = useAccountsStore();

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<MovementStage>>({
  id: null,
  name: null,
  account_id: null,
});

const currentAccount = computed(() => accountsStore.currentAccount);

async function back() {
  await router.push({ name: 'movement-stages' });
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();
      let response;
      const recordData = {
        ...record,
        account_id: currentAccount.value?.id,
      } as Partial<MovementStage>;

      if (record.id) {
        response = await resource.update(record.id.toString(), recordData);
        Object.assign(record, response.data);
        Notify.create({
          message: `Operação realizada com sucesso`,
          color: 'positive',
          icon: 'check',
        });
      } else {
        await resource.create(recordData);
        Notify.create({
          message: `Etapas "Entrada ${record.name}" e "Saída ${record.name}" criadas com sucesso`,
          color: 'positive',
          icon: 'check',
        });
        await back();
        return;
      }
    }
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

onMounted(async () => {
  if (route.params.id) {
    try {
      Loading.show();
      const id = route.params.id as string;
      const response = await resource.findById(id);
      Object.assign(record, response.data);
    } catch (error) {
      console.error(error);
      showError(error);
    } finally {
      Loading.hide();
    }
  }
});
</script>
