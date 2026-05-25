<template>
  <DefaultPage>
    <template #outside-card>
      <q-breadcrumbs class="q-mb-md">
        <q-breadcrumbs-el label="Home" to="/" />
        <q-breadcrumbs-el label="Perfis" to="/perfis" />
        <q-breadcrumbs-el :label="breadcrumbLabel" />
      </q-breadcrumbs>
    </template>
    <template #header>
      <RecordPageHeader
        title="Perfil"
        @back="back"
        @save="save"
        :save-permission="savePermission"
      />
    </template>
    <template #content>
      <q-form ref="formRef" @submit="save">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="record.name"
              label="Nome"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
          <div class="col-12 col-md-8">
            <div class="row justify-end items-center q-gutter-sm">
              <q-btn
                color="negative"
                icon="check_box_outline_blank"
                label="Desabilitar Todas"
                outline
                @click="disableAllGlobalPermissions"
                :disable="Object.keys(groupedPermissions).length === 0"
              >
                <q-tooltip>Desabilitar todas as permissões de todos os grupos</q-tooltip>
              </q-btn>
              <q-btn
                color="positive"
                icon="check_box"
                label="Habilitar Todas"
                outline
                @click="enableAllGlobalPermissions"
                :disable="Object.keys(groupedPermissions).length === 0"
              >
                <q-tooltip>Habilitar todas as permissões de todos os grupos</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Cards de Permissões -->
        <div
          class="row q-col-gutter-md items-start"
          v-if="Object.keys(groupedPermissions).length > 0"
        >
          <div class="col-6">
            <h6 class="text-h6 q-mb-md self-end">Permissões</h6>
          </div>
          <div class="col-6 q-mb-md text-right self-end">
            <q-btn
              class="q-mr-sm"
              color="negative"
              icon="keyboard_arrow_up"
              label="Exibir Todos"
              outline
              @click="showAllGlobalPermissions"
              :disable="Object.keys(groupedPermissions).length === 0"
            >
              <q-tooltip>Exibir todas as permissões de todos os grupos</q-tooltip>
            </q-btn>
            <q-btn
              color="positive"
              icon="keyboard_arrow_down"
              label="Ocultar Todos"
              outline
              @click="hideAllGlobalPermissions"
              :disable="Object.keys(groupedPermissions).length === 0"
            >
              <q-tooltip>Ocultar todas as permissões de todos os grupos</q-tooltip>
            </q-btn>
          </div>

          <div
            v-for="(permission, keyGroup) in groupedPermissions"
            :key="keyGroup"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card class="full-height" flat bordered>
              <q-card-section>
                <div class="row items-center justify-between">
                  <div class="text-h6 text-capitalize">
                    {{ formatGroupName(keyGroup) }}
                  </div>
                  <div class="row q-gutter-xs">
                    <q-btn
                      size="sm"
                      dense
                      flat
                      color="negative"
                      icon="check_box_outline_blank"
                      @click="disableAllPermissions(keyGroup)"
                    >
                      <q-tooltip>Desabilitar Todos</q-tooltip>
                    </q-btn>
                    <q-btn
                      size="sm"
                      dense
                      flat
                      color="positive"
                      icon="check_box"
                      @click="enableAllPermissions(keyGroup)"
                    >
                      <q-tooltip>Habilitar Todos</q-tooltip>
                    </q-btn>
                    <q-btn
                      size="md"
                      dense
                      flat
                      color="positive"
                      :icon="getIconByPermission(permission)"
                      @click="toggleAllPermissions(keyGroup)"
                    >
                      <q-tooltip>Exibir permissões</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section v-if="permission.show && permission.list.length > 0">
                <div class="column q-gutter-sm">
                  <div v-for="item in permission.list" :key="item.id" class="row items-center">
                    <q-checkbox
                      v-model="item.selected"
                      :label="item.name"
                      color="primary"
                      @update:model-value="onPermissionToggle(item)"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-form>
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { Profile } from 'src/interfaces/profiles';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useProfilesResource } from 'src/composables/api/useProfilesResource';
import { useAccountsStore } from 'src/stores/accounts';
import { usePermissionsResource } from 'src/composables/api/usePermissionsResource';
import { usePermissionsStore } from 'src/stores/permissions';
import { useUsersStore } from 'src/stores/users';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useProfilesResource();
const accountsStore = useAccountsStore();
const permissionsResource = usePermissionsResource();
const permissionsStore = usePermissionsStore();
const usersStore = useUsersStore();

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<Profile>>({
  id: '',
  name: '',
  account_id: '',
});

const breadcrumbLabel = computed(() => {
  return record.name || 'Perfil';
});

type Permission = {
  show: boolean;
  list: any[];
};

const groupedPermissions = ref<Record<string, Permission>>({});

const currentAccount = computed(() => accountsStore.currentAccount);
const currentUser = computed(() => usersStore.currentUser);
const savePermission = computed(() => (record.id ? 'PROFILES_UPDATE' : 'PROFILES_CREATE'));

const allPermissions = computed(() =>
  permissionsStore.permissions.filter((permission: any) => permission.key_group !== 'ACCOUNTS'),
);

function getIconByPermission(permission: Permission): string {
  if (permission.show && permission.list.length > 0) {
    return 'keyboard_arrow_up';
  }

  return 'keyboard_arrow_down';
}

// Função para agrupar permissões por key_group
function groupPermissionsByKeyGroup(permissions: any[], existingPermissions: any[] = []) {
  const grouped: Record<string, Permission> = {};

  permissions.forEach((permission: any) => {
    const keyGroup = permission.key_group;
    if (!grouped[keyGroup]) {
      grouped[keyGroup] = {
        show: false,
        list: [],
      };
    }

    // Verificar se esta permissão está nas permissões existentes do perfil
    const isSelected = existingPermissions.some((existing) => existing.id === permission.id);

    grouped[keyGroup].list.push({
      ...permission,
      selected: isSelected,
    });
  });

  return grouped;
}

// Função para formatar o nome do grupo
function formatGroupName(keyGroup: string): string {
  const groupNames: Record<string, string> = {
    USERS: 'Usuários',
    PROFILES: 'Perfis',
    PERMISSIONS: 'Permissões',
    PRODUCTS: 'Produtos',
    CATEGORIES: 'Categorias',
    STOCK: 'Estoque',
    INVENTORY: 'Inventário',
    SUPLIERS: 'Fornecedores',
    CUSTOMERS: 'Clientes',
    SUPPLIERS: 'Fornecedores',
    STOCKS: 'Estoques',
    STOCK_RECORDS: 'Registros de Estoque',
    MOVEMENT_STAGES: 'Etapas de Movimentação',
    REPORT_PRODUCTS_IN_STOCK: 'Relatório - Produtos em Estoque',
    REPORT_STOCK_BELLOW_MINIMUM: 'Relatório - Estoque Abaixo do Mínimo',
    REPORT_STOCK_MOVEMENTS: 'Relatório - Movimentações de Estoque',
    REPORT_MOST_MOVED_PRODUCTS: 'Relatório - Produtos Mais Movimentados',
  };

  return groupNames[keyGroup] || keyGroup.replace(/_/g, ' ');
}

// Função para lidar com mudanças no estado das permissões
function onPermissionToggle(permission: any) {
  console.log(
    `Permissão ${permission.name} foi ${permission.selected ? 'habilitada' : 'desabilitada'}`,
  );
  // Aqui você pode adicionar lógica adicional quando uma permissão for alterada
}

// Função para habilitar todas as permissões de um grupo
function enableAllPermissions(keyGroup: string) {
  const permissions = groupedPermissions.value[keyGroup];
  if (permissions) {
    permissions.list.forEach((item) => {
      item.selected = true;
    });
    console.log(`Todas as permissões do grupo "${formatGroupName(keyGroup)}" foram habilitadas`);
  }
}

// Função para desabilitar todas as permissões de um grupo
function disableAllPermissions(keyGroup: string) {
  const permissions = groupedPermissions.value[keyGroup];
  if (permissions) {
    permissions.list.forEach((item) => {
      item.selected = false;
    });
    console.log(`Todas as permissões do grupo "${formatGroupName(keyGroup)}" foram desabilitadas`);
  }
}

// Função para habilitar todas as permissões de todos os grupos
function enableAllGlobalPermissions() {
  Object.keys(groupedPermissions.value).forEach((keyGroup) => {
    enableAllPermissions(keyGroup);
  });
  console.log('Todas as permissões de todos os grupos foram habilitadas');
}

// Função para desabilitar todas as permissões de todos os grupos
function disableAllGlobalPermissions() {
  Object.keys(groupedPermissions.value).forEach((keyGroup) => {
    disableAllPermissions(keyGroup);
  });
  console.log('Todas as permissões de todos os grupos foram desabilitadas');
}

function toggleAllPermissions(keyGroup: string) {
  const permissions = groupedPermissions.value[keyGroup];
  if (permissions) {
    permissions.show = !permissions.show;
  }
}

// Função para mostrar todas as permissões de um grupo
function showAllPermissions(keyGroup: string) {
  const permissions = groupedPermissions.value[keyGroup];
  if (permissions) {
    permissions.show = true;
    console.log(`Todas as permissões do grupo "${formatGroupName(keyGroup)}" foram exibidas`);
  }
}

// Função para ocultar todas as permissões de um grupo
function hideAllPermissions(keyGroup: string) {
  const permissions = groupedPermissions.value[keyGroup];
  if (permissions) {
    permissions.show = false;
    console.log(`Todas as permissões do grupo "${formatGroupName(keyGroup)}" foram ocultadas`);
  }
}

// Função para exibir todas as permissões de todos os grupos
function showAllGlobalPermissions() {
  Object.keys(groupedPermissions.value).forEach((keyGroup) => {
    showAllPermissions(keyGroup);
  });
  console.log('Todas as permissões de todos os grupos foram exibidas');
}

// Função para ocultar todas as permissões de todos os grupos
function hideAllGlobalPermissions() {
  Object.keys(groupedPermissions.value).forEach((keyGroup) => {
    hideAllPermissions(keyGroup);
  });
  console.log('Todas as permissões de todos os grupos foram ocultadas');
}

// Função para obter lista de IDs das permissões selecionadas
function getSelectedPermissionIds(): string[] {
  const selectedIds: string[] = [];

  Object.keys(groupedPermissions.value).forEach((keyGroup) => {
    const permissions = groupedPermissions.value[keyGroup];
    if (permissions && Array.isArray(permissions.list)) {
      permissions.list.forEach((item) => {
        if (item.selected) {
          selectedIds.push(item.id);
        }
      });
    }
  });

  return selectedIds;
}

async function back() {
  await router.push({ name: 'profiles' });
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();
      let response;

      console.log('Permissões selecionadas (IDs):', getSelectedPermissionIds());
      console.log('Todas as permissões agrupadas:', groupedPermissions.value);

      const recordData = {
        ...record,
        account_id: currentAccount.value?.id,
      } as Partial<Profile>;

      if (record.id) {
        response = await resource.update(record.id.toString(), recordData);
      } else {
        response = await resource.create(recordData);
      }
      Object.assign(record, response.data);

      await resource.syncPermissions(`${record.id}`, getSelectedPermissionIds());

      Notify.create({
        message: `Operação realizada com sucesso`,
        color: 'positive',
        icon: 'check',
      });
    }
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

onMounted(async () => {
  try {
    Loading.show();

    // Carregar todas as permissões disponíveis
    await permissionsResource.loadPermissions({ profile_id: currentUser.value?.profile_id });

    if (route.params.id) {
      // Edição: carregar dados do perfil e suas permissões
      const id = route.params.id as string;
      const response = await resource.findById(id);
      Object.assign(record, response.data);

      // Carregar as permissões existentes do perfil
      const profilePermissionsResponse = await permissionsResource.findByProfileId(id);

      console.log(profilePermissionsResponse.data);

      // Agrupar permissões marcando as existentes como selecionadas
      groupedPermissions.value = groupPermissionsByKeyGroup(
        allPermissions.value,
        profilePermissionsResponse.data,
      );
    } else {
      // Criação: apenas agrupar permissões sem seleções
      groupedPermissions.value = groupPermissionsByKeyGroup(allPermissions.value);
    }
  } catch (error) {
    console.error(error);
    showError(error);
  } finally {
    Loading.hide();
  }
});
</script>
