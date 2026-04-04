<template>
  <q-btn icon="notifications" round dense flat>
    <q-badge color="amber-7" text-color="black" v-if="unreads > 0" floating rounded>
      {{ unreads }}
    </q-badge>
    <q-menu>
      <q-list style="max-width: 300px; max-height: 400vh" padding separator>
        <q-infinite-scroll
          @load="loadNotifications"
          :disable="!hasMore"
          :offset="200"
          style="max-height: 400px"
        >
          <q-item v-for="(notification, key) in notifications" :key="notification.id ?? key">
            <q-item-section avatar>
              <q-btn
                :icon="getNotificationIcon(`${notification.key}`)"
                color="primary"
                dense
                round
                unelevated
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ notification.message }}
              </q-item-label>
              <q-item-label caption>{{
                datetimeToClient(`${notification.updated_at}`)
              }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                @click="checkNotificationAsRead(notification)"
                v-if="notification.read_at === null"
                icon="mark_email_unread"
                color="primary"
                round
                dense
                flat
              >
                <q-tooltip>Marcar como lido</q-tooltip>
              </q-btn>
              <q-btn
                v-else
                @click="checkNotificationAsRead(notification)"
                icon="mark_as_unread"
                color="grey-4"
                round
                dense
                flat
              >
                <q-tooltip>Marcar como não lido</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <template v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import type { Socket } from 'socket.io-client';
import { useNotificationsResource } from 'src/composables/api/useNotificationsResource';
import { useDate } from 'src/composables/useDate';
import { useHandleException } from 'src/composables/useHandleException';
import { useWebsocket } from 'src/composables/useWebsocket';
import type { Notification } from 'src/interfaces/notifications';
import { useAuthStore } from 'src/stores/auth';
import { useNotificationsStore } from 'src/stores/notifications';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const { getSocketConnection, onReconnect } = useWebsocket();
const socket = ref<Socket | null>(null);
const { datetimeToClient } = useDate();
const notificationsResource = useNotificationsResource();
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();
const { showError } = useHandleException();

const currentPage = ref(1);
const hasMore = ref(false);

const notifications = computed(() => {
  return notificationsStore.notifications;
});

const unreads = computed(() => {
  return notificationsStore.unreads;
});

const currentUser = computed(() => {
  return authStore.currentUser;
});

const currentUserId = computed(() => currentUser.value?.id);

const loadNotifications = async (index: number, done: () => void) => {
  try {
    // Evita buscar notificações para `user_id` indefinido.
    if (!currentUserId.value) {
      done();
      return;
    }

    const { data: response } = await notificationsResource.findAll({
      user_id: currentUserId.value,
      page: index,
    });

    currentPage.value = response.page;
    hasMore.value = response.page < response.last_page;

    notificationsStore.setUnreads(response.total_unread);
    notificationsStore.setNotifications([
      ...notifications.value,
      ...(response.data as Notification[]),
    ]);
    done();
  } catch (error) {
    showError(error);
    done();
  }
};

function getNotificationIcon(key: string) {
  if (key.includes('TABLE_SESSION')) {
    return 'table_restaurant';
  }
  if (key.includes('ORDER')) {
    return 'receipt_long';
  }
  if (key.includes('COMMAND')) {
    return 'receipt_long';
  }
  if (key.includes('CHAT')) {
    return 'chat';
  }
  return 'notifications';
}

async function checkNotificationAsRead(notification: Partial<Notification>) {
  try {
    if (!notification.id) return;

    const nextReadAt = notification.read_at === null ? dayjs().toISOString() : null;
    const response = await notificationsResource.update(`${notification.id}`, {
      read_at: nextReadAt,
    });

    notificationsStore.updateNotification(response.data);
  } catch (error) {
    showError(error);
  }
}

async function handleStartWebsocketEvents() {
  if (!currentUserId.value) return;

  socket.value = await getSocketConnection();

  socket.value.emit(`notifications:user:join`, {
    user_id: currentUserId.value,
  });

  socket.value.on(`notifications:upsert`, (data: Notification) => {
    notificationsStore.updateNotification(data);
  });

  onReconnect(() => {
    socket.value?.emit(`notifications:user:join`, {
      user_id: currentUserId.value,
    });
  });
}

function handleStopWebsocketEvents() {
  socket.value?.emit(`notifications:user:leave`, {
    user_id: currentUser.value?.id,
  });
  socket.value?.off(`notifications:upsert`);
  socket.value?.off(`notifications:user:join`);
}

onUnmounted(() => {
  handleStopWebsocketEvents();
});

const initialized = ref(false);

async function initNotifications() {
  if (!currentUserId.value || initialized.value) return;

  await loadNotifications(currentPage.value, () => {});
  await handleStartWebsocketEvents();
  initialized.value = true;
}

onMounted(() => {
  void initNotifications();
});

watch(currentUserId, () => {
  void initNotifications();
});
</script>

<style scoped></style>
