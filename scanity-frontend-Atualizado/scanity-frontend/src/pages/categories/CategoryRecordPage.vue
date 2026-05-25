<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader
        title="Categoria"
        @back="back"
        @save="save"
        :save-permission="record.id ? 'CATEGORIES_UPDATE' : 'CATEGORIES_CREATE'"
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
            <q-input v-model="record.description" label="Descrição" bg-color="white" outlined />
          </div>
        </div>
      </q-form>
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { Category } from 'src/interfaces/categories';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useCategoriesResource } from 'src/composables/api/useCategoriesResource';
import { useAccountsStore } from 'src/stores/accounts';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useCategoriesResource();
const accountsStore = useAccountsStore();

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<Category>>({
  id: null,
  name: null,
  description: null,
  account_id: null,
});

const currentAccount = computed(() => accountsStore.currentAccount);

async function back() {
  await router.push({ name: 'categories' });
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();
      let response;
      const recordData = {
        ...record,
        account_id: currentAccount.value?.id,
      } as Partial<Category>;

      if (record.id) {
        response = await resource.update(record.id.toString(), recordData);
      } else {
        response = await resource.create(recordData);
      }

      Object.assign(record, response.data);
      Notify.create({
        message: `Operação realizada com sucesso`,
        color: 'positive',
        icon: 'check',
      });
      await router.push({ name: 'category', params: { id: response.data.id } });
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
