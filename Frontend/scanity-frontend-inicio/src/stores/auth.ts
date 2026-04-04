import { defineStore, acceptHMRUpdate } from 'pinia';
import type { User } from 'src/interfaces/users';
import { computed, ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<Partial<User>>();

  const accountType = computed(() => {
    return currentUser.value?.account_type;
  });

  const profileId = computed(() => {
    return currentUser.value?.profile_id;
  });

  function setCurrentUser(data: Partial<User>) {
    currentUser.value = data;
  }

  return { currentUser, accountType, profileId, setCurrentUser };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
