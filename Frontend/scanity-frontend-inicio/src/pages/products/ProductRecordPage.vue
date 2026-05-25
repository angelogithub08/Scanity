<template>
  <DefaultPage>
    <template #header>
      <RecordPageHeader
        title="Produto"
        @back="back"
        @save="save"
        :save-permission="record.id ? 'PRODUCTS_UPDATE' : 'PRODUCTS_CREATE'"
      >
        <template #append_buttons>
          <q-btn
            v-if="record.id && record.barcode"
            flat
            dense
            no-caps
            icon="qr_code_2"
            label="Visualizar QR Code"
            class="text-grey-8 q-ml-sm"
            @click="qrDialogOpen = true"
          />
        </template>
      </RecordPageHeader>
    </template>
    <template #content>
      <!-- Área de visualização e upload da imagem (acima do formulário) -->
      <div v-if="record.id" class="product-image-section q-mb-lg">
        <div class="row justify-center items-center q-gutter-md">
          <div class="thumbnail-preview bg-grey-3 rounded-borders flex flex-center col-12">
            <q-img
              v-if="thumbnailUrl"
              :src="thumbnailUrl"
              ratio="1"
              width="120px"
              height="120px"
              class="rounded-borders shadow-2"
              fit="contain"
            />
            <q-icon v-else name="image" size="48px" color="grey-6" />
          </div>
          <div class="row justify-center items-center q-gutter-xs col-12">
            <div class="row q-gutter-xs">
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                icon="upload"
                label="Enviar"
                :loading="uploadingThumbnail"
                @click="triggerFileInput"
                class="text-grey-8"
              />
              <q-btn
                v-if="record.thumbnail_path"
                flat
                dense
                no-caps
                size="sm"
                icon="delete"
                label="Remover"
                :loading="removingThumbnail"
                @click="removeThumbnail"
                class="text-grey-7"
              />
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              class="hidden"
              @change="onFileSelected"
            />
          </div>
        </div>
      </div>

      <q-form ref="formRef" @submit="save">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-input
              v-model="record.name"
              label="Nome"
              bg-color="white"
              outlined
              lazy-rules
              :rules="[validation.required]"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="record.value"
              label="Valor"
              bg-color="white"
              outlined
              lazy-rules
              prefix="R$"
              v-maska
              data-maska="9.99#,##"
              data-maska-tokens="9:[0-9]:repeated"
              data-maska-reversed
              :rules="[validation.required]"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="record.category_id"
              :options="categoriesOptions"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              label="Categoria"
              bg-color="white"
              outlined
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input v-model="record.barcode" label="Código de Barras" bg-color="white" outlined />
          </div>

          <div class="col-12">
            <q-input
              v-model="record.description"
              label="Descrição"
              bg-color="white"
              type="textarea"
              outlined
            />
          </div>
        </div>
      </q-form>

      <QrCodeDialog
        v-model="qrDialogOpen"
        :title="record.name ?? null"
        :barcode="record.barcode ?? null"
      />
    </template>
  </DefaultPage>
</template>

<script setup lang="ts">
import { Notify, QForm, Loading } from 'quasar';
import type { Product } from 'src/interfaces/products';
import { reactive, ref, onMounted, computed } from 'vue';
import DefaultPage from 'src/components/shared/pages/DefaultPage.vue';
import RecordPageHeader from 'src/components/shared/pages/RecordPageHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { useValidation } from 'src/composables/useValidation';
import { useHandleException } from 'src/composables/useHandleException';
import { useProductsResource } from 'src/composables/api/useProductsResource';
import { useAccountsStore } from 'src/stores/accounts';
import { useCurrency } from 'src/composables/useCurrency';
import { useCategoriesResource } from 'src/composables/api/useCategoriesResource';
import type { Category } from 'src/interfaces/categories';
import QrCodeDialog from 'src/components/shared/QrCodeDialog.vue';

const router = useRouter();
const route = useRoute();
const validation = useValidation();
const { showError } = useHandleException();
const resource = useProductsResource();
const accountsStore = useAccountsStore();
const { parseCurrency } = useCurrency();
const categoriesResource = useCategoriesResource();

const qrDialogOpen = ref(false);

const formRef = ref<InstanceType<typeof QForm>>();

const record = reactive<Partial<Product>>({
  id: null,
  name: null,
  value: null,
  barcode: null,
  description: null,
  account_id: null,
  category_id: null,
  thumbnail_path: null,
});

const categoriesOptions = ref<Partial<Category>[]>([]);
const thumbnailUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadingThumbnail = ref(false);
const removingThumbnail = ref(false);

const currentAccount = computed(() => accountsStore.currentAccount);

async function back() {
  await router.push({ name: 'products' });
}

async function save() {
  try {
    const valid = await formRef.value?.validate();
    if (valid) {
      Loading.show();
      let response;
      const recordData = {
        ...record,
        value: parseCurrency(record.value as unknown as string),
        account_id: currentAccount.value?.id,
      } as Partial<Product>;

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

      await router.push({ name: 'product', params: { id: response.data.id } });
    }
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

async function loadCategories() {
  try {
    const accountId = currentAccount.value?.id;
    if (accountId) {
      const response = await categoriesResource.list({ account_id: accountId });
      categoriesOptions.value = response.data;
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

async function loadThumbnailUrl() {
  if (!record.id || !record.thumbnail_path) {
    thumbnailUrl.value = null;
    return;
  }
  try {
    const response = await resource.getThumbnailUrl(record.id.toString());
    thumbnailUrl.value = response.data?.url ?? null;
  } catch (error) {
    console.error('Erro ao carregar URL da thumbnail:', error);
    thumbnailUrl.value = null;
  }
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || !record.id) return;
  try {
    uploadingThumbnail.value = true;
    const response = await resource.uploadThumbnail(record.id.toString(), file);
    Object.assign(record, response.data);
    await loadThumbnailUrl();
    Notify.create({
      message: 'Imagem enviada com sucesso',
      color: 'positive',
      icon: 'check',
    });
  } catch (error) {
    showError(error);
  } finally {
    uploadingThumbnail.value = false;
  }
}

async function removeThumbnail() {
  if (!record.id) return;
  try {
    removingThumbnail.value = true;
    await resource.deleteThumbnail(record.id.toString());
    record.thumbnail_path = null;
    thumbnailUrl.value = null;
    Notify.create({
      message: 'Imagem removida com sucesso',
      color: 'positive',
      icon: 'check',
    });
  } catch (error) {
    showError(error);
  } finally {
    removingThumbnail.value = false;
  }
}

onMounted(async () => {
  await loadCategories();

  if (route.params.id) {
    try {
      Loading.show();
      const id = route.params.id as string;
      const response = await resource.findById(id);
      Object.assign(record, response.data);
      await loadThumbnailUrl();
    } catch (error) {
      console.error(error);
      showError(error);
    } finally {
      Loading.hide();
    }
  }
});
</script>

<style scoped lang="scss">
.product-image-section {
  padding: 0.75rem 0;
}

.thumbnail-preview {
  width: 120px;
  height: 120px;
  min-width: 120px;
  min-height: 120px;
}
</style>
