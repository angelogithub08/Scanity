<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title style="font-size: 14px; font-weight: bold">
          {{ currentUser?.name }}
        </q-toolbar-title>

        <q-btn
          icon="smart_toy"
          round
          dense
          flat
          aria-label="Assistente"
          class="q-mr-sm"
          @click="agentDrawerOpen = true"
        />
        <NotificationsIndicator class="q-mr-sm" />
        <q-btn icon="person" round dense flat>
          <q-menu>
            <q-list separator>
              <q-item clickable v-ripple :to="{ name: 'user-data' }">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>Meus Dados</q-item-section>
              </q-item>
              <q-item clickable v-ripple :to="{ name: 'plans-subscription' }" v-if="isAdminAccount">
                <q-item-section avatar>
                  <q-icon name="receipt_long" />
                </q-item-section>
                <q-item-section>Planos</q-item-section>
              </q-item>
              <q-item clickable v-ripple :to="{ name: 'subscriptions' }" v-if="isAdminAccount">
                <q-item-section avatar>
                  <q-icon name="subscriptions" />
                </q-item-section>
                <q-item-section>Assinaturas</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="openPrivacyPolicyDialog">
                <q-item-section avatar>
                  <q-icon name="policy" />
                </q-item-section>
                <q-item-section>Política de Privacidade</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="openTermsOfServiceDialog">
                <q-item-section avatar>
                  <q-icon name="description" />
                </q-item-section>
                <q-item-section>Termos de Serviço</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="logout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Sair</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="320"
      class="modern-drawer bg-grey-10"
      style="border-right: 1px solid #081b34"
    >
      <q-scroll-area class="drawer-scroll">
        <div class="flex justify-center items-center q-py-lg">
          <q-img src="/logo.svg" width="170px" />
        </div>
        <q-list>
          <!-- Dashboards (sem permissão) -->
          <q-item-label header class="nav-header">
            <q-icon name="dashboard" size="16px" />
            Dashboards
          </q-item-label>
          <q-item
            clickable
            v-ripple
            :to="{ name: 'main-dashboard' }"
            class="nav-item"
            active-class="nav-item-active"
            dense
          >
            <q-item-section avatar>
              <q-icon name="dashboard" class="nav-icon" size="20px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Painel principal</q-item-label>
              <q-item-label caption class="nav-caption">Visão geral</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="nav-separator" />

          <template v-if="isAdminAccount">
            <q-item-label header class="nav-header">
              <q-icon name="apps" size="16px" />
              Administrativo
            </q-item-label>

            <q-separator class="nav-separator" />
          </template>

          <!-- Seção Gestão -->
          <q-item-label header class="nav-header">
            <q-icon name="inventory" size="16px" />
            Gestão
          </q-item-label>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'products' }"
            class="nav-item"
            active-class="nav-item-active"
          >
            <q-item-section avatar>
              <q-icon name="inventory_2" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Produtos</q-item-label>
              <q-item-label caption class="nav-caption">Gerencie os produtos</q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            clickable
            v-ripple
            :to="{ name: 'categories' }"
            class="nav-item"
            active-class="nav-item-active"
          >
            <q-item-section avatar>
              <q-icon name="category" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Categorias</q-item-label>
              <q-item-label caption class="nav-caption">Gerencie as categorias</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'stocks' }"
            class="nav-item"
            active-class="nav-item-active"
          >
            <q-item-section avatar>
              <q-icon name="inventory" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Estoque</q-item-label>
              <q-item-label caption class="nav-caption">Gerencie o estoque</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'tokens' }"
            class="nav-item"
            active-class="nav-item-active"
            v-if="isAdminAccount"
          >
            <q-item-section avatar>
              <q-icon name="key" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Tokens</q-item-label>
              <q-item-label caption class="nav-caption">Tokens de integração</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'users' }"
            class="nav-item"
            active-class="nav-item-active"
          >
            <q-item-section avatar>
              <q-icon name="people" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Usuários</q-item-label>
              <q-item-label caption class="nav-caption">Gerencie os usuários</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view v-if="!loading && currentAccount" :key="route.fullPath" />
    </q-page-container>
    <div style="display: none">
      <audio id="notification-sound" src="/notification2.mp3" />
    </div>

    <AgentPromptDrawer v-model="agentDrawerOpen" />

    <PrivacyPolicyDialog ref="privacyPolicyDialogRef" />
    <TermsOfServiceDialog ref="termsOfServiceDialogRef" />
  </q-layout>
</template>

<script setup lang="ts">
import { Loading } from 'quasar';
import { useAuthResource, useUsersResource } from 'src/composables/api';
import { useAccountsStore } from 'src/stores/accounts';
import { computed, onBeforeMount, onMounted, onUnmounted, ref } from 'vue';

import { useHandleException } from 'src/composables/useHandleException';
import { useAuthStore } from 'src/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { useUsersStore } from 'src/stores/users';
import PrivacyPolicyDialog from 'src/components/shared/PrivacyPolicyDialog.vue';
import TermsOfServiceDialog from 'src/components/shared/TermsOfServiceDialog.vue';
import AgentPromptDrawer from 'src/components/agent/AgentPromptDrawer.vue';
import NotificationsIndicator from 'src/components/notifications/NotificationsIndicator.vue';

const router = useRouter();
const route = useRoute();
const authResource = useAuthResource();
const usersResource = useUsersResource();
const usersStore = useUsersStore();

const accountsStore = useAccountsStore();
const authStore = useAuthStore();
const leftDrawerOpen = ref(false);
const agentDrawerOpen = ref(false);
const privacyPolicyDialogRef = ref<InstanceType<typeof PrivacyPolicyDialog> | null>(null);
const termsOfServiceDialogRef = ref<InstanceType<typeof TermsOfServiceDialog> | null>(null);
const { showError } = useHandleException();

function openPrivacyPolicyDialog() {
  privacyPolicyDialogRef.value?.open();
}

function openTermsOfServiceDialog() {
  termsOfServiceDialogRef.value?.open();
}

const loading = ref(false);
let refreshTokenInterval: NodeJS.Timeout | null = null;

const currentAccount = computed(() => {
  return accountsStore.currentAccount;
});

const currentUser = computed(() => {
  return usersStore.currentUser;
});

const isAdminAccount = computed(() => {
  return currentUser.value?.account_type === 'ADMIN';
});

// Rotas que podem ser acessadas sem plano ativo
const exceptionalRoutes = [
  'subscriptions',
  'plans-subscription',
  'plans-checkout',
  'plans-success',
  'user-data',
];

// Computed para verificar se deve mostrar o banner de sem plano
const shouldShowNoPlanBanner = computed(() => {
  // Se a rota atual é uma exceção
  const isExceptionalRoute = route.name ? exceptionalRoutes.includes(route.name.toString()) : false;

  // Mostra o banner apenas se não há plano E não é uma rota excepcional
  return !isExceptionalRoute;
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function loadLists() {
  const account_id = currentAccount.value?.id;
  await Promise.all([usersResource.loadUsers({ account_id })]);
}

function logout() {
  localStorage.removeItem('token');
  void router.push({ name: 'login' });
}

onBeforeMount(async () => {
  Loading.show();
  try {
    const user = await authResource.getMe();
    authStore.setCurrentUser(user.data);
    usersStore.setCurrentUser(user.data);
    accountsStore.setCurrentAccount({ id: user.data.account_id });

    await loadLists();
  } catch (error) {
    console.error(error);
    showError(error);
  } finally {
    loading.value = false;
    Loading.hide();
  }
});

onMounted(() => {
  // Renova o access token a cada 10 minutos (600000ms)
  refreshTokenInterval = setInterval(() => {
    authResource
      .refreshToken(currentUser.value?.id as string)
      .then((response) => {
        // Atualiza os tokens no localStorage
        authResource.setTokens(response.data.access_token, response.data.refresh_token);
        authStore.setCurrentUser(response.data.user);
        console.log('Token renovado com sucesso');
      })
      .catch((error) => {
        console.error('Erro ao renovar token:', error);
        // Se o refresh token falhar, redireciona para o login
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          void router.push({ name: 'login' });
        }
      });
  }, 20000); // 20 segundos
});

onUnmounted(() => {
  if (refreshTokenInterval) {
    clearInterval(refreshTokenInterval);
    refreshTokenInterval = null;
  }
});
</script>

<style scoped>
.modern-drawer {
  background: linear-gradient(135deg, #0a0e1a 0%, #14192c 100%);
  border-right: 1px solid rgba(8, 27, 52, 0.2);
  box-shadow: 4px 0 20px rgba(8, 27, 52, 0.2);
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.drawer-scroll {
  height: calc(100vh);
  background: transparent;
}

.nav-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #38b6ff;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 20px 8px 20px;
  margin-bottom: 4px;
}

.nav-item {
  margin: 12px 16px 10px 8px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(8, 27, 52, 0.1) 0%, rgba(8, 27, 52, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-item:hover {
  background: rgba(8, 27, 52, 0.08);
  border-color: rgba(8, 27, 52, 0.2);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(8, 27, 52, 0.15);
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item-active {
  background: linear-gradient(135deg, rgba(8, 27, 52, 0.15) 0%, rgba(8, 27, 52, 0.1) 100%);
  border-color: rgba(8, 27, 52, 0.3);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(8, 27, 52, 0.2);
}

.nav-item-active::before {
  opacity: 1;
}

.nav-item-active .nav-icon {
  color: #38b6ff;
  transform: scale(1.1);
}

.nav-item-active .nav-label {
  color: #ffffff;
  font-weight: 600;
}

.nav-item-active .nav-caption {
  color: #38b6ff;
}

.nav-icon {
  color: #b0b0b0 !important;
  font-size: 20px;
  transition: all 0.3s ease;
}

.nav-item:hover .nav-icon {
  color: #38b6ff;
  transform: scale(1.05);
}

.nav-label {
  color: #e0e0e0;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.2;
  transition: all 0.3s ease;
}

.nav-item:hover .nav-label {
  color: #ffffff;
}

.nav-caption {
  color: #888;
  font-size: 11px;
  margin-top: 2px;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.nav-item:hover .nav-caption {
  color: #b0b0b0;
}

.nav-separator {
  margin: 16px 20px;
  background: rgba(8, 27, 52, 0.2);
  height: 1px;
}

:deep(.q-item__section--avatar) {
  min-width: 40px;
  padding-right: 12px;
}

:deep(.q-item__section--main) {
  justify-content: center;
}

:deep(.q-scrollarea__thumb) {
  background: rgba(8, 27, 52, 0.3);
  border-radius: 4px;
  width: 6px;
}

:deep(.q-scrollarea__thumb:hover) {
  background: rgba(8, 27, 52, 0.5);
}

:deep(.q-scrollarea__bar) {
  background: rgba(8, 27, 52, 0.1);
  border-radius: 4px;
  width: 6px;
}

:deep(.q-ripple) {
  color: rgba(8, 27, 52, 0.3);
}
</style>
