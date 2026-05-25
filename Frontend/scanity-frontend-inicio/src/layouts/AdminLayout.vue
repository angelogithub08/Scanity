<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Área Administrativa </q-toolbar-title>

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
      style="border-right: 1px solid #315aff"
    >
      <q-scroll-area class="drawer-scroll">
        <div class="flex justify-center items-center q-py-md">
          <q-img src="/logo.svg" width="200px" />
        </div>
        <q-list>
          <q-item-label header class="nav-header">
            <q-icon name="apps" size="16px" />
            Painéis
          </q-item-label>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'admin-dashboard' }"
            class="nav-item"
            active-class="nav-item-active"
          >
            <q-item-section avatar>
              <q-icon name="dashboard" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Dashboard Admin</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="nav-separator" />

          <q-item-label header class="nav-header">
            <q-icon name="account_balance_wallet" size="16px" />
            Financeiro
          </q-item-label>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'accounts' }"
            class="nav-item"
            active-class="nav-item-active"
          >
            <q-item-section avatar>
              <q-icon name="account_balance" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Contas</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'admin-users' }"
            class="nav-item"
            active-class="nav-item-active"
          >
            <q-item-section avatar>
              <q-icon name="people" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Usuários</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'admin-logs' }"
            class="nav-item"
            active-class="nav-item-active"
          >
            <q-item-section avatar>
              <q-icon name="history" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Logs do Sistema</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="nav-separator" />

          <q-item-label header class="nav-header">
            <q-icon name="settings" size="16px" />
            Gerenciamento
          </q-item-label>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'admin-payment-methods' }"
            class="nav-item"
            active-class="nav-item-active"
          >
            <q-item-section avatar>
              <q-icon name="payments" class="nav-icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">Métodos de pagamento</q-item-label>
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
import { useWebsocket } from 'src/composables/useWebsocket';
import NotificationsIndicator from 'src/components/notifications/NotificationsIndicator.vue';
import type { Socket } from 'socket.io-client';
import { first, has } from 'lodash';

const { getSocketConnection, onReconnect } = useWebsocket();
const router = useRouter();
const route = useRoute();
const authResource = useAuthResource();
const usersResource = useUsersResource();
const usersStore = useUsersStore();

const accountsStore = useAccountsStore();
const authStore = useAuthStore();
const leftDrawerOpen = ref(false);
const { showError } = useHandleException();

const socket = ref<Socket | null>(null);
const loading = ref(false);

const currentAccount = computed(() => {
  return accountsStore.currentAccount;
});

const currentUser = computed(() => {
  return usersStore.currentUser;
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
  console.log('onBeforeMount', 'entrei aqui');
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
</script>

<style scoped>
.modern-drawer {
  background: linear-gradient(135deg, #0a0e1a 0%, #14192c 100%);
  border-right: 1px solid rgba(49, 90, 255, 0.2);
  box-shadow: 4px 0 20px rgba(49, 90, 255, 0.2);
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
  color: #315aff;
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
  background: linear-gradient(135deg, rgba(49, 90, 255, 0.1) 0%, rgba(49, 90, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-item:hover {
  background: rgba(49, 90, 255, 0.08);
  border-color: rgba(49, 90, 255, 0.2);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(49, 90, 255, 0.15);
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item-active {
  background: linear-gradient(135deg, rgba(49, 90, 255, 0.15) 0%, rgba(49, 90, 255, 0.1) 100%);
  border-color: rgba(49, 90, 255, 0.3);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(49, 90, 255, 0.2);
}

.nav-item-active::before {
  opacity: 1;
}

.nav-item-active .nav-icon {
  color: #315aff;
  transform: scale(1.1);
}

.nav-item-active .nav-label {
  color: #ffffff;
  font-weight: 600;
}

.nav-item-active .nav-caption {
  color: #315aff;
}

.nav-icon {
  color: #b0b0b0;
  font-size: 20px;
  transition: all 0.3s ease;
}

.nav-item:hover .nav-icon {
  color: #315aff;
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
  background: rgba(49, 90, 255, 0.2);
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
  background: rgba(49, 90, 255, 0.3);
  border-radius: 4px;
  width: 6px;
}

:deep(.q-scrollarea__thumb:hover) {
  background: rgba(49, 90, 255, 0.5);
}

:deep(.q-scrollarea__bar) {
  background: rgba(49, 90, 255, 0.1);
  border-radius: 4px;
  width: 6px;
}

:deep(.q-ripple) {
  color: rgba(49, 90, 255, 0.3);
}
</style>
