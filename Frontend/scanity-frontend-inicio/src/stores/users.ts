import { defineStore, acceptHMRUpdate } from 'pinia';
import type { User } from 'src/interfaces/users';
import { ref } from 'vue';

export const useUsersStore = defineStore('users', () => {
  const currentUser = ref<Partial<User>>();
  const users = ref<Partial<User>[]>([]);

  function setCurrentUser(data: Partial<User>) {
    currentUser.value = data;
  }

  function setUsers(data: Partial<User>[]) {
    users.value = data;
  }

  return { users, setUsers, currentUser, setCurrentUser };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUsersStore, import.meta.hot));
}
