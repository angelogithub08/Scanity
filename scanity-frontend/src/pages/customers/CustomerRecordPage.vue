<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader
        title="Cliente"
        @back="back"
        @save="save"
        :save-permission="record.id ? 'CUSTOMERS_UPDATE' : 'CUSTOMERS_CREATE'"
      />
    </template>
    <template #content>
      <q-form ref="formRef" @submit="save">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-4">
            <q-input
              v-model="record.name"
              label="Nome"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <q-input
              v-model="record.document"
              label="CPF/CNPJ"
              bg-color="white"
              outlined
              v-maska="cpfCnpjMaskOptions"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <q-input
              v-model="record.phone"
              label="Telefone"
              bg-color="white"
              v-maska="phoneMaskOptions"
              outlined
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <q-input
              v-model="record.email"
              label="E-mail"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.isValidEmail]"
            />
          </div>
          <div class="col-12">
            <span>Dados de Endereço</span>
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="record.zipcode"
              label="CEP"
              bg-color="white"
              outlined
              mask="#####-###"
            >
              <template #append>
                <q-btn icon="search" @click="searchAddressByZipcode" round dense flat />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="record.street" label="Rua" bg-color="white" outlined />
          </div>
          <div class="col-12 col-md-3">
            <q-input v-model="record.number" label="Número" bg-color="white" outlined />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="record.city" label="Cidade" bg-color="white" outlined />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="record.state" label="Estado" bg-color="white" outlined />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="record.neighborhood" label="Bairro" bg-color="white" outlined />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="record.complement" label="Complemento" bg-color="white" outlined />
          </div>
        </div>
      </q-form>
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { Customer } from 'src/interfaces/customers';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useCustomersResource } from 'src/composables/api/useCustomersResource';
import { useAccountsStore } from 'src/stores/accounts';
import { useViaCepsResource } from 'src/composables/api';
import { useMask } from 'src/composables/useMask';
const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useCustomersResource();
const accountsStore = useAccountsStore();
const { getAddressByZipcode } = useViaCepsResource();
const { onlyNumbers, cpfCnpjMaskOptions, phoneMaskOptions } = useMask();

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<Customer>>({
  id: null,
  name: null,
  document: null,
  phone: null,
  email: null,
  street: null,
  number: null,
  city: null,
  state: null,
  neighborhood: null,
  zipcode: null,
  complement: null,
});

const typeOptions = [
  { label: 'Reclamada', value: 'RECLAMADA' },
  { label: 'Reclamante', value: 'RECLAMANTE' },
];

const currentAccount = computed(() => accountsStore.currentAccount);

async function back() {
  await router.push({ name: 'customers' });
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();
      let response;
      const recordData = {
        ...record,
        document: onlyNumbers(record.document as string),
        phone: onlyNumbers(record.phone as string),
        zipcode: onlyNumbers(record.zipcode as string),
        account_id: currentAccount.value?.id,
      } as Partial<Customer>;

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

      await router.push({ name: 'customer', params: { id: response.data.id } });
    }
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

async function searchAddressByZipcode() {
  const zipcode = onlyNumbers(record.zipcode as string);
  const response = await getAddressByZipcode(zipcode);
  Object.assign(record, {
    street: response.data.logradouro,
    city: response.data.localidade,
    state: response.data.uf,
    neighborhood: response.data.bairro,
    zipcode: response.data.cep,
    complement: response.data.complemento,
  });
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
