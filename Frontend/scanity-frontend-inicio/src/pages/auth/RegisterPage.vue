<template>
  <div class="full-height flex column items-center justify-center">
    <q-card flat>
      <q-card-section>
        <div class="text-h6 text-center">
          <img :src="logo" alt="Scanity" width="200" />
        </div>
        <div class="text-center">Crie sua conta para começar.</div>
      </q-card-section>
      <q-card-section>
        <q-form ref="form" @submit="handleSubmit" class="row q-col-gutter-md">
          <div class="col-12">
            <q-input v-model="name" :rules="[required]" lazy-rules label="Nome" outlined>
              <template v-slot:prepend>
                <q-icon name="person" color="primary" />
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input
              v-model="email"
              :rules="[required, isValidEmail]"
              lazy-rules
              label="E-mail"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="email" color="primary" />
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input
              v-model="password"
              label="Senha"
              outlined
              :rules="[required]"
              lazy-rules
              :type="passwordVisible ? 'text' : 'password'"
            >
              <template v-slot:prepend>
                <q-icon name="lock" color="primary" />
              </template>
              <template v-slot:append>
                <q-btn
                  flat
                  dense
                  rounded
                  :icon="passwordVisible ? 'visibility_off' : 'visibility'"
                  color="primary"
                  @click="passwordVisible = !passwordVisible"
                />
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-checkbox
              v-model="acceptTerms"
              class="full-width"
              @update:model-value="acceptTermsError = null"
            >
              <span class="text-body2">
                Li e aceito os
                <a href="#" class="text-primary text-weight-medium" @click.prevent="openTermsDialog"
                  >Termos de Serviço</a
                >
                e a
                <a
                  href="#"
                  class="text-primary text-weight-medium"
                  @click.prevent="openPrivacyDialog"
                  >Política de Privacidade</a
                >.
              </span>
            </q-checkbox>
            <q-banner
              v-if="acceptTermsError"
              class="bg-negative/10 text-negative q-mt-xs"
              rounded
              dense
            >
              {{ acceptTermsError }}
            </q-banner>
          </div>
          <div class="col-12">
            <q-btn
              label="Cadastrar"
              color="primary"
              class="full-width"
              unelevated
              type="submit"
              :disabled="!acceptTerms"
            />
          </div>
          <div class="col-12 text-center cursor-pointer">
            <p color="text-primary" @click="goToLogin">Já tem uma conta? Faça login</p>
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <TermsOfServiceDialog ref="termsDialogRef" />
    <PrivacyPolicyDialog ref="privacyDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { Loading, Notify, QForm } from 'quasar';
import { useAccountsResource } from 'src/composables/api';
import { useHandleException } from 'src/composables/useHandleException';
import { useValidation } from 'src/composables/useValidation';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import PrivacyPolicyDialog from 'src/components/shared/PrivacyPolicyDialog.vue';
import TermsOfServiceDialog from 'src/components/shared/TermsOfServiceDialog.vue';
import logo from '/logo-bg-light.svg';

const router = useRouter();
const accountsResource = useAccountsResource();
const { showError } = useHandleException();
const { required, isValidEmail } = useValidation();

const name = ref<string | null>(null);
const email = ref<string | null>(null);
const password = ref<string | null>(null);
const passwordVisible = ref(false);
const acceptTerms = ref(false);
const acceptTermsError = ref<string | null>(null);
const form = ref<InstanceType<typeof QForm>>();
const termsDialogRef = ref<InstanceType<typeof TermsOfServiceDialog>>();
const privacyDialogRef = ref<InstanceType<typeof PrivacyPolicyDialog>>();
const TERMS_ERROR_MSG = 'É necessário aceitar os Termos de Serviço e a Política de Privacidade.';

function openTermsDialog() {
  termsDialogRef.value?.open();
}

function openPrivacyDialog() {
  privacyDialogRef.value?.open();
}

function goToLogin() {
  void router.push({ name: 'login' });
}

async function handleSubmit() {
  acceptTermsError.value = null;
  if (!acceptTerms.value) {
    acceptTermsError.value = TERMS_ERROR_MSG;
    return;
  }
  const valid = await form.value?.validate();
  if (valid) {
    Loading.show();
    try {
      await accountsResource.register({
        name: name.value as string,
        email: email.value as string,
        password: password.value as string,
      });
      void router.push({ name: 'login' });

      Notify.create({
        message: 'Conta criada com sucesso. Verifique seu e-mail para ativar a conta.',
        color: 'positive',
        icon: 'check',
      });
    } catch (error) {
      showError(error);
    } finally {
      Loading.hide();
    }
  }
}
</script>

<style scoped>
.q-checkbox a {
  text-decoration: none;
  cursor: pointer;
}
.q-checkbox a:hover {
  text-decoration: underline;
}
</style>
