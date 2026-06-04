import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Permission } from 'src/interfaces/permissions';
import { ref } from 'vue';

export const usePermissionsStore = defineStore('permissions', () => {
  const currentPermission = ref<Partial<Permission>>();
  const permissions = ref<Partial<Permission>[]>([]);

  function setCurrentPermission(data: Partial<Permission>) {
    currentPermission.value = data;
  }

  function setPermissions(data: Partial<Permission>[]) {
    permissions.value = data;
  }

  return { permissions, setPermissions, currentPermission, setCurrentPermission };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePermissionsStore, import.meta.hot));
}
