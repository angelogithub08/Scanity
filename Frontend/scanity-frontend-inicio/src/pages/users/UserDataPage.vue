<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader
        title="Meus Dados"
        @save="save"
        :showBackButton="false"
        save-permission="USERS_UPDATE"
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
          <div class="col-12">
            <div class="text-h6 q-mb-md">Alterar Senha</div>
            <div class="text-caption text-grey-7 q-mb-md">
              Deixe em branco caso não queira alterar a senha
            </div>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="record.password"
              label="Nova Senha"
              type="password"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.min6]"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="passwordConfirmation"
              label="Confirmar Nova Senha"
              type="password"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.sameAs(record.password, 'As senhas não conferem')]"
            />
          </div>

          <template v-if="isAdminAccount">
            <div class="col-12">
              <q-separator class="q-my-lg" />
              <div class="text-h6 q-mb-md">Dados da Conta</div>
              <div class="text-caption text-grey-7 q-mb-md">
                Esta seção é visível apenas para administradores
              </div>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="accountRecord.name"
                label="Nome da Conta"
                bg-color="white"
                outlined
                lazy-rules
                :rules="[validation.required]"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="accountRecord.email"
                label="Email da Conta"
                bg-color="white"
                outlined
                lazy-rules
                :rules="[validation.isValidEmail, validation.required]"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-input
                v-model="accountRecord.phone"
                label="Telefone"
                bg-color="white"
                outlined
                lazy-rules
                v-maska
                data-maska="(##) #####-####"
                :rules="[validation.isValidPhone]"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-input
                v-model="accountRecord.document"
                label="CPF/CNPJ"
                bg-color="white"
                outlined
                lazy-rules
                v-maska
                data-maska="['###.###.###-##', '##.###.###/####-##']"
                :rules="[validation.documentIsValid]"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-input
                v-model="accountRecord.zipcode"
                label="CEP"
                bg-color="white"
                outlined
                lazy-rules
                v-maska
                data-maska="#####-###"
                :rules="[validation.isValidZipCode]"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-input
                v-model="accountRecord.address_number"
                label="Número do Endereço"
                bg-color="white"
                outlined
                lazy-rules
              />
            </div>

            <div class="col-12">
              <q-input
                type="textarea"
                v-model="accountRecord.ia_token"
                label="Tokens da OpenIA"
                bg-color="white"
                outlined
                lazy-rules
              />
            </div>

            <div class="col-12 text-right">
              <q-btn
                @click="saveAccount"
                icon="save"
                label="Salvar Dados da Conta"
                color="primary"
                unelevated
                class="q-mt-md"
              />
            </div>
          </template>

          <div class="col-12">
            <q-separator class="q-my-lg" />
            <div class="text-h6 text-negative q-mb-sm">Zona de Perigo</div>
            <div class="text-caption text-grey-7 q-mb-md">
              Para excluir a conta, informe seu e-mail de login e enviaremos um link de confirmação.
            </div>
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="deleteAccountEmail"
              label="E-mail para confirmação de exclusão"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required, validation.isValidEmail]"
            />
          </div>

          <div class="col-12 col-md-6 flex items-end justify-end">
            <q-btn
              color="negative"
              icon="delete_forever"
              label="Solicitar exclusão da conta"
              unelevated
              @click="requestAccountDeletion"
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
import type { Account } from 'src/interfaces/accounts';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useUsersResource } from 'src/composables/api/useUsersResource';
import { useAccountsResource } from 'src/composables/api/useAccountsResource';
import { useUsersStore } from 'src/stores/users';
import { useAccountsStore } from 'src/stores/accounts';

const validation = useValidation();
const { showError } = useHandleException();
const resource = useUsersResource();
const accountsResource = useAccountsResource();
const usersStore = useUsersStore();
const accountsStore = useAccountsStore();

const formRef = ref<InstanceType<typeof QForm>>();
const passwordConfirmation = ref<string | null>(null);
const deleteAccountEmail = ref<string | null>(null);

const record = reactive<Partial<User>>({
  id: null,
  name: null,
  email: null,
  password: null,
  profile_id: null,
  account_id: null,
  token: null,
});

const accountRecord = reactive<Partial<Account>>({
  id: null,
  name: null,
  email: null,
  phone: null,
  document: null,
  zipcode: null,
  address_number: null,
  ia_token: null,
});

const currentUser = computed(() => usersStore.currentUser);
const currentAccount = computed(() => accountsStore.currentAccount);
const isAdminAccount = computed(() => currentUser.value?.account_type === 'ADMIN');

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();

      const recordData: Partial<User> = {
        name: record.name || null,
        email: record.email || null,
      };

      // Apenas envia a senha se foi preenchida
      if (record.password && record.password.trim() !== '') {
        recordData.password = record.password;
      }

      const response = await resource.update(record.id!.toString(), recordData);

      // Atualiza o currentUser na store
      usersStore.setCurrentUser(response.data);

      // Atualiza o record local
      Object.assign(record, {
        ...response.data,
        password: null,
      });

      // Limpa o campo de confirmação de senha
      passwordConfirmation.value = null;

      Notify.create({
        message: 'Dados atualizados com sucesso',
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

async function saveAccount() {
  try {
    Loading.show();

    const accountData: Partial<Account> = {
      name: accountRecord.name || null,
      email: accountRecord.email || null,
      phone: accountRecord.phone || null,
      document: accountRecord.document || null,
      zipcode: accountRecord.zipcode || null,
      address_number: accountRecord.address_number || null,
      ia_token: accountRecord.ia_token || null,
    };

    const response = await accountsResource.update(accountRecord.id!.toString(), accountData);

    // Atualiza o currentAccount na store
    accountsStore.setCurrentAccount(response.data);

    // Atualiza o accountRecord local
    Object.assign(accountRecord, response.data);

    Notify.create({
      message: 'Dados da conta atualizados com sucesso',
      color: 'positive',
      icon: 'check',
    });
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

async function requestAccountDeletion() {
  try {
    if (!deleteAccountEmail.value) {
      Notify.create({
        message: 'Informe o e-mail para confirmação de exclusão',
        color: 'warning',
        icon: 'warning',
      });
      return;
    }

    Loading.show();
    await accountsResource.requestDeleteAccount(deleteAccountEmail.value);

    Notify.create({
      message: 'Enviamos um e-mail com o link para confirmar a exclusão da conta',
      color: 'positive',
      icon: 'mail',
    });
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

onMounted(async () => {
  if (currentUser.value) {
    Object.assign(record, {
      ...currentUser.value,
      password: null,
    });
  }

  // Carrega os dados da conta se for admin
  if (isAdminAccount.value && currentAccount.value?.id) {
    try {
      Loading.show();
      const response = await accountsResource.findById(currentAccount.value.id.toString());
      Object.assign(accountRecord, response.data);
    } catch (error) {
      console.error(error);
      showError(error);
    } finally {
      Loading.hide();
    }
  }
});
</script>
