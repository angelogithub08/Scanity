import { defineStore, acceptHMRUpdate } from 'pinia';
import type { ProfilePermission } from 'src/interfaces/profile-permissions';
import { ref } from 'vue';

export const useProfilePermissionsStore = defineStore('profile-permissions', () => {
  const currentProfilePermission = ref<Partial<ProfilePermission>>();
  const profilePermissions = ref<Partial<ProfilePermission>[]>([]);

  function setCurrentProfilePermission(data: Partial<ProfilePermission>) {
    currentProfilePermission.value = data;
  }

  function setProfilePermissions(data: Partial<ProfilePermission>[]) {
    profilePermissions.value = data;
  }

  return {
    profilePermissions,
    setProfilePermissions,
    currentProfilePermission,
    setCurrentProfilePermission,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfilePermissionsStore, import.meta.hot));
}
