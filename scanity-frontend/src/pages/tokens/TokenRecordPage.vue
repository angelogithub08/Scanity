<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader
        title="Token"
        @back="back"
        @save="save"
        :save-permission="record.id ? 'TOKENS_UPDATE' : 'TOKENS_CREATE'"
      />
    </template>
    <template #content>
      <q-form ref="formRef" @submit="save">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-banner class="bg-primary text-white" rounded>
              <template v-slot:avatar>
                <q-icon name="info" color="white" />
              </template>
              <div class="text-body1">
                Um novo token de acesso será gerado automaticamente ao salvar.
              </div>
            </q-banner>
          </div>

          <div class="col-12">
            <q-input
              v-model="record.type"
              label="Tipo"
              bg-color="white"
              outlined
              readonly
              :rules="[validation.required]"
              hint="Tipo do token (fixo)"
            />
          </div>

          <div class="col-12">
            <q-select
              v-model="record.user_id"
              :options="users"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              label="Usuário"
              bg-color="white"
              outlined
              :readonly="!!record.id"
              :rules="[validation.required]"
              hint="Usuário relacionado ao token"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey"> Nenhum usuário disponível </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div v-if="record.id" class="col-12">
            <q-input
              v-model="record.token"
              label="Token Gerado"
              bg-color="white"
              outlined
              readonly
              hint="Token de autenticação (copie e guarde em local seguro)"
            >
              <template v-slot:append>
                <q-btn flat round dense icon="content_copy" color="primary" @click="copyToken">
                  <q-tooltip>Copiar Token</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>

          <div v-if="record.revoked_at" class="col-12">
            <q-input
              v-model="formattedRevokedAt"
              label="Revogado em"
              bg-color="white"
              outlined
              readonly
              hint="Data de revogação do token"
            >
              <template v-slot:prepend>
                <q-icon name="block" color="negative" />
              </template>
            </q-input>
          </div>
        </div>
      </q-form>
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { Token } from 'src/interfaces/tokens';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useTokensResource } from 'src/composables/api/useTokensResource';
import { useAccountsStore } from 'src/stores/accounts';
import { useUsersStore } from 'src/stores/users';
import { useAuthStore } from 'src/stores/auth';
import { useClipboard } from 'src/composables/useClipboard';
import { useDate } from 'src/composables/useDate';
import { useUsersResource } from 'src/composables/api/useUsersResource';
import type { User } from 'src/interfaces/users';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useTokensResource();
const usersResource = useUsersResource();
const accountsStore = useAccountsStore();
const usersStore = useUsersStore();
const authStore = useAuthStore();
const { copyToClipboard } = useClipboard();
const { datetimeToClient } = useDate();

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<Token>>({
  id: null,
  type: 'ACCESS_TOKEN', // Tipo fixo
  token: null,
  revoked_at: null,
  user_id: null,
});

const users = ref<User[]>([]);
const currentAccount = computed(() => accountsStore.currentAccount);
const currentUser = computed(() => usersStore.currentUser);

// Formatar data de revogação
const formattedRevokedAt = computed(() => {
  if (!record.revoked_at) return '';
  return datetimeToClient(record.revoked_at) || '';
});

async function back() {
  await router.push({ name: 'tokens' });
}

// Copiar token para clipboard
function copyToken() {
  if (record.token) {
    void copyToClipboard(record.token);
    Notify.create({
      type: 'positive',
      message: 'Token copiado para a área de transferência!',
      icon: 'content_copy',
    });
  }
}

async function loadUsersList() {
  try {
    const response = await usersResource.list({
      account_id: currentAccount.value?.id,
    });
    users.value = response.data;
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    showError(error);
  }
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show({ message: 'Gerando token...' });
      let response;
      const recordData = {
        type: 'ACCESS_TOKEN', // Sempre ACCESS_TOKEN
        account_id: currentAccount.value?.id,
        user_id: record.user_id,
      } as Partial<Token>;

      // Novos tokens são sempre criados, não há edição
      if (!record.id) {
        response = await resource.create(recordData);
        Object.assign(record, response.data);

        Notify.create({
          message: 'Token gerado com sucesso! Copie e guarde em local seguro.',
          color: 'positive',
          icon: 'check',
          timeout: 5000,
        });
      }
    }
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

onMounted(async () => {
  try {
    Loading.show();

    // Carregar lista de usuários
    await loadUsersList();

    record.user_id = currentUser.value?.id || null;

    // Se estiver editando, carregar o token existente
    if (route.params.id) {
      const id = route.params.id as string;
      const response = await resource.findById(id);
      Object.assign(record, response.data);
    }
  } catch (error) {
    console.error(error);
    showError(error);
  } finally {
    Loading.hide();
  }
});
</script>
