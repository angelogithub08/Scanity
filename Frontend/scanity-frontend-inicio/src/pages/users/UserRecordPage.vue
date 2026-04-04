<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader
        title="Usuário"
        @back="back"
        @save="save"
        :save-permission="record.id ? 'USERS_UPDATE' : 'USERS_CREATE'"
      />
    </template>
    <template #content>
      <q-form ref="formRef" @submit="save">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="record.name"
              label="Nome"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="record.email"
              label="Email"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.isValidEmail, validation.required]"
            />
          </div>
          <div class="col-12 col-md-6" v-if="!record.id">
            <q-input
              v-model="record.password"
              label="Senha"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required, validation.min6]"
              type="password"
            />
          </div>
          <div class="col-12 col-md-6" v-else>
            <q-input
              v-model="record.password"
              label="Senha"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.min6]"
              type="password"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-toggle
              v-model="isActiveModel"
              label="Usuário Ativo"
              color="positive"
              :disable="isEditingSelf"
            />
          </div>
        </div>
      </q-form>
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { User } from 'src/interfaces/users';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useUsersResource } from 'src/composables/api/useUsersResource';
import { useAccountsStore } from 'src/stores/accounts';
import { useAuthStore } from 'src/stores/auth';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useUsersResource();
const accountsStore = useAccountsStore();
const authStore = useAuthStore();

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<User>>({
  id: null,
  name: null,
  email: null,
  password: null,
  account_id: null,
  token: null,
  is_active: false,
});

const currentAccount = computed(() => accountsStore.currentAccount);

const isEditingSelf = computed<boolean>(() => {
  return Boolean(record.id && record.id === authStore.currentUser?.id);
});

const isActiveModel = computed({
  get: () => record.is_active ?? false,
  set: (value: boolean) => {
    record.is_active = value;
  },
});

async function back() {
  await router.push({ name: 'users' });
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
      } as Partial<User>;

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
