import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Permission } from 'src/interfaces/permissions';
import type { User } from 'src/interfaces/users';
import { computed, ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<Partial<User>>();
  const permissions = ref<Partial<Permission>[]>([]);

  function setPermissions(data: Partial<Permission>[]) {
    permissions.value = data;
  }

  const accountType = computed(() => {
    return currentUser.value?.account_type;
  });

  const profileId = computed(() => {
    return currentUser.value?.profile_id;
  });

  function setCurrentUser(data: Partial<User>) {
    currentUser.value = data;
  }

  return { currentUser, accountType, profileId, setCurrentUser, permissions, setPermissions };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
