<template>
  <div class="full-height flex column items-center justify-center">
    <q-card flat>
      <q-card-section>
        <div class="text-h6 text-center">
          <img :src="logo" alt="Scanity" width="200" />
        </div>
        <div class="text-center">
          {{
            step === 'credentials'
              ? 'Bem-vindo, utilize seu acesso para continuar.'
              : 'Digite o código de 6 dígitos enviado para seu e-mail.'
          }}
        </div>
      </q-card-section>
      <q-card-section>
        <q-banner
          v-if="confirmed"
          class="bg-positive/10 text-positive q-my-md q-pa-md bg-green-1"
          rounded
          dense
        >
          Conta confirmada com sucesso.
        </q-banner>
        <q-banner
          v-if="accountDeleted === 'true'"
          class="q-my-md q-pa-md bg-green-1 text-positive"
          rounded
          dense
        >
          {{ accountDeleteMessage || 'Conta excluída com sucesso.' }}
        </q-banner>
        <q-banner
          v-if="accountDeleted === 'false'"
          class="q-my-md q-pa-md bg-red-1 text-negative"
          rounded
          dense
        >
          {{ accountDeleteMessage || 'Não foi possível excluir a conta.' }}
        </q-banner>
        <!-- Passo 1: e-mail e senha -->
        <q-form
          v-if="step === 'credentials'"
          ref="form"
          @submit="handleSubmitCredentials"
          class="row q-col-gutter-md"
        >
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
            <div class="row q-col-gutter-md">
              <div class="col-12 text-right cursor-pointer" @click="goToForgotPassword">
                Esqueci minha senha?
              </div>
              <div class="col-12 col-md-6">
                <q-btn
                  label="Criar Conta"
                  class="full-width"
                  outline
                  type="button"
                  @click="goToRegister"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-btn label="Entrar" color="primary" class="full-width" unelevated type="submit" />
              </div>
            </div>
          </div>
        </q-form>

        <!-- Passo 2: código 2FA -->
        <q-form v-else ref="formCode" @submit="handleSubmitCode" class="row q-col-gutter-md">
          <div class="col-12">
            <q-input
              v-model="twoFactorCode"
              label="Código de verificação"
              outlined
              :rules="[
                required,
                () => String(twoFactorCode || '').length === 6 || 'O código deve ter 6 dígitos',
              ]"
              lazy-rules
              maxlength="6"
              type="tel"
              inputmode="numeric"
              placeholder="000000"
            >
              <template v-slot:prepend>
                <q-icon name="pin" color="primary" />
              </template>
            </q-input>
            <div class="text-caption text-grey q-mt-sm">
              Enviamos um código de 6 dígitos para <strong>{{ email }}</strong>
            </div>
          </div>
          <div class="col-12">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-btn
                  label="Confirmar"
                  color="primary"
                  class="full-width"
                  unelevated
                  type="submit"
                />
              </div>
              <div class="col-12">
                <q-btn
                  label="Voltar"
                  class="full-width"
                  flat
                  type="button"
                  @click="
                    step = 'credentials';
                    twoFactorCode = null;
                  "
                />
              </div>
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { Loading, QForm } from 'quasar';
import { useAuthResource } from 'src/composables/api';
import { useHandleException } from 'src/composables/useHandleException';
import { useValidation } from 'src/composables/useValidation';
import { useAccountsStore } from 'src/stores/accounts';
import { useAuthStore } from 'src/stores/auth';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import logo from '/logo-bg-light.svg';

const router = useRouter();
const route = useRoute();
const authResource = useAuthResource();
const authStore = useAuthStore();
const accountsStore = useAccountsStore();
const { showError } = useHandleException();
const { required, isValidEmail } = useValidation();

type LoginStep = 'credentials' | 'code';

const step = ref<LoginStep>('credentials');
const email = ref<string | null>(null);
const password = ref<string | null>(null);
const passwordVisible = ref(false);
const twoFactorCode = ref<string | null>(null);
const form = ref<InstanceType<typeof QForm>>();
const formCode = ref<InstanceType<typeof QForm>>();

const confirmed = computed(() => route.query.confirmed as string);
const accountDeleted = computed(() => route.query.accountDeleted as string);
const accountDeleteMessage = computed(() => route.query.message as string);

function goToForgotPassword() {
  void router.push({ name: 'forgot-password' });
}

function goToRegister() {
  void router.push({ name: 'register' });
}

async function finishLogin() {
  const profile = await authResource.getMe();
  authStore.setCurrentUser(profile.data);
  accountsStore.setCurrentAccount({ id: profile.data.account_id });

  void router.push({ name: 'main-dashboard' });
}

async function handleSubmitCredentials() {
  const valid = await form.value?.validate();
  if (!valid) return;
  Loading.show();
  try {
    const response = await authResource.login({
      email: email.value as string,
      password: password.value as string,
    });

    if (response.data.requires_two_factor) {
      step.value = 'code';
      twoFactorCode.value = null;
      return;
    }

    if (response.data.access_token && response.data.refresh_token) {
      authResource.setTokens(response.data.access_token, response.data.refresh_token);
      await finishLogin();
    }
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}

async function handleSubmitCode() {
  const valid = await formCode.value?.validate();
  if (!valid) return;
  Loading.show();
  try {
    const response = await authResource.verifyTwoFactor(
      email.value as string,
      twoFactorCode.value as string,
    );
    authResource.setTokens(response.data.access_token, response.data.refresh_token);
    await finishLogin();
  } catch (error) {
    showError(error);
  } finally {
    Loading.hide();
  }
}
</script>
