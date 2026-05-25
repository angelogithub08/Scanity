import { uniqBy } from 'lodash';
import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAudio } from 'src/composables/useAudio';
import type { Notification } from 'src/interfaces/notifications';
import { computed, ref } from 'vue';

export const useNotificationsStore = defineStore('notifications', () => {
  const currentNotification = ref<Partial<Notification>>();
  const notifications = ref<Partial<Notification>[]>([]);
  const unreads = ref(0);
  const { playAudio } = useAudio();

  const unreadNotifications = computed(() =>
    notifications.value.filter(
      (notification: Partial<Notification>) => notification.read_at === null,
    ),
  );

  function setCurrentNotification(data: Partial<Notification>) {
    currentNotification.value = data;
  }

  function setNotifications(data: Partial<Notification>[]) {
    notifications.value = uniqBy(data, 'id');
  }

  function setUnreads(data: number) {
    unreads.value = Math.max(0, data);
  }

  function updateNotification(data: Partial<Notification>) {
    if (!data.id) return;

    const index = notifications.value.findIndex((notification) => notification.id === data.id);
    const previous = index !== -1 ? notifications.value[index] : undefined;

    const previousUnread = previous?.read_at === null;
    const nextUnread = data.read_at === null;

    if (index !== -1) {
      notifications.value.splice(index, 1, data);

      // Ajusta contador de não lidas apenas quando o status muda.
      if (previousUnread && !nextUnread) setUnreads(unreads.value - 1);
      if (!previousUnread && nextUnread) setUnreads(unreads.value + 1);
      return;
    }

    // Caso seja uma nova notificação, insere no topo.
    notifications.value.unshift(data);

    if (nextUnread) {
      setUnreads(unreads.value + 1);
      playAudio();
    }
  }

  return {
    notifications,
    setNotifications,
    currentNotification,
    setCurrentNotification,
    updateNotification,
    setUnreads,
    unreads,
    unreadNotifications,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationsStore, import.meta.hot));
}
