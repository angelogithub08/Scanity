<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container class="bg-video-container" style="height: 100vh">
      <video autoplay muted playsinline class="bg-video" poster="/preview-bg-login.png">
        <source src="/bg-auth.mp4" type="video/mp4" />
      </video>
      <div class="full-height row justify-end">
        <div class="col-12 col-sm-6 col-md-9" v-if="q.screen.gt.xs"></div>
        <div class="col-12 col-sm-6 col-md-3 bg-white">
          <router-view />
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useAuthResource } from 'src/composables/api';
import { useHandleException } from 'src/composables/useHandleException';
import { useAccountsStore } from 'src/stores/accounts';
import { useAuthStore } from 'src/stores/auth';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const q = useQuasar();
const authResource = useAuthResource();
const authStore = useAuthStore();
const accountsStore = useAccountsStore();
const { showError } = useHandleException();

onMounted(async () => {
  if (localStorage.getItem('token')) {
    try {
      const user = await authResource.getMe();
      authStore.setCurrentUser(user.data);
      accountsStore.setCurrentAccount({ id: user.data.account_id });
      void router.push({ name: 'dashboard' });
    } catch (error) {
      showError(error);
    }
  }
});
</script>

<style scoped>
.bg-video-container {
  position: relative;
  overflow: hidden;
}

.bg-video {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  transform: translate(-50%, -50%);
  z-index: 0;
  object-fit: cover;
}

.row {
  position: relative;
  z-index: 1;
}
</style>
