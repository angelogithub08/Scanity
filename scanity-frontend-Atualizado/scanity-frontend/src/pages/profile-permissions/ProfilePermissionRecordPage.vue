<template>
  <DefaultPage>
    <template #outside-card>
      <q-breadcrumbs class="q-mb-md">
        <q-breadcrumbs-el label="Home" to="/" />
        <q-breadcrumbs-el label="Permissões de Perfil" to="/profile-permissions" />
        <q-breadcrumbs-el :label="breadcrumbLabel" />
      </q-breadcrumbs>
    </template>
    <template #header>
      <RecordPageHeader
        title="Permissão De Perfil"
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
              v-model="record.profile_id"
              label="Profile Id"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="record.permission_id"
              label="Permission Id"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
        </div>
      </q-form>
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { ProfilePermission } from 'src/interfaces/profile-permissions';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useProfilePermissionsResource } from 'src/composables/api/useProfilePermissionsResource';
import { omit } from 'lodash';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useProfilePermissionsResource();

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<ProfilePermission>>({
  id: '',
  profile_id: '',
  permission_id: '',
});

const breadcrumbLabel = computed(() => {
  return 'Permissão de Perfil';
});

const savePermission = computed(() =>
  record.id ? 'PROFILE_PERMISSIONS_UPDATE' : 'PROFILE_PERMISSIONS_CREATE',
);

async function back() {
  await router.push({ name: 'profile-permissions' });
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();
      let response;
      if (record.id) {
        response = await resource.update(record.id.toString(), record);
      } else {
        response = await resource.create(omit(record, 'id'));
      }
      Object.assign(record, response.data);
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
  if (route.params.id) {
    try {
      Loading.show();
      const id = route.params.id as string;
      const response = await resource.findById(id);
      Object.assign(record, response.data);
    } catch (error) {
      console.error(error);
      showError(error);
    } finally {
      Loading.hide();
    }
  }
});
</script>
