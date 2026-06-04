<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader
        title="Fornecedor"
        @back="back"
        @save="save"
        :save-permission="record.id ? 'SUPLIERS_UPDATE' : 'SUPLIERS_CREATE'"
      />
    </template>
    <template #content>
      <q-form ref="formRef" @submit="save">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="record.name"
              label="Nome"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="record.phone"
              label="Telefone"
              bg-color="white"
              type="tel"
              v-maska="phoneMaskOptions"
              outlined
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input v-model="record.email" label="Email" bg-color="white" type="email" outlined />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="record.responsible_name"
              label="Responsável"
              bg-color="white"
              outlined
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input v-model="record.observations" label="Observações" bg-color="white" outlined />
          </div>
        </div>
      </q-form>
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { Suplier } from 'src/interfaces/supliers';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useSupliersResource } from 'src/composables/api/useSupliersResource';
import { useAccountsStore } from 'src/stores/accounts';
import { useMask } from 'src/composables/useMask';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useSupliersResource();
const { phoneMaskOptions, onlyNumbers } = useMask();
const accountsStore = useAccountsStore();

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<Suplier>>({
  id: null,
  name: null,
  phone: null,
  email: null,
  responsible_name: null,
  observations: null,
});

const currentAccount = computed(() => accountsStore.currentAccount);

async function back() {
  await router.push({ name: 'supliers' });
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();
      let response;
      const recordData = {
        ...record,
        phone: onlyNumbers(record.phone as string),
        account_id: currentAccount.value?.id,
      } as Partial<Suplier>;

      if (record.id) {
        response = await resource.update(record.id.toString(), recordData);
      } else {
        response = await resource.create(recordData);
      }

      Object.assign(record, response.data);
      Notify.create({
        message: `Operação realizada com sucesso`,
        color: 'positive',
        icon: 'check',
      });

      await router.push({ name: 'suplier', params: { id: response.data.id } });
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
