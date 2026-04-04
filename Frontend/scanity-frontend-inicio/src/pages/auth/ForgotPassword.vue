<template>
  <div class="full-height flex column items-center justify-center">
    <q-card flat>
      <q-card-section>
        <div class="text-h6 text-center">
          <img :src="logo" alt="Scanity" width="200" />
        </div>
        <div class="text-center">Utilize seu e-mail para recuperar sua senha.</div>
      </q-card-section>
      <q-card-section>
        <q-form ref="form" class="row q-col-gutter-md" @submit="onSubmit">
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
            <q-btn label="Enviar" color="primary" class="full-width" unelevated type="submit" />
          </div>
          <div class="col-12">
            <q-btn label="Login" color="primary" class="full-width" outline @click="goToLogin" />
          </div>
          <div class="col-12 text-center cursor-pointer">
            <p color="text-primary" @click="goToDefineNewPassword">Já tenho o código</p>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { Loading, Notify, QForm } from 'quasar';
import { useAuthResource } from 'src/composables/api';
import { useHandleException } from 'src/composables/useHandleException';
import { useValidation } from 'src/composables/useValidation';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import logo from '/logo-bg-light.svg';

const router = useRouter();
const authResource = useAuthResource();
const { showError } = useHandleException();
const { required, isValidEmail } = useValidation();
const form = ref<InstanceType<typeof QForm>>();

const email = ref<string | null>(null);

async function onSubmit() {
  const isValid = await form.value?.validate();
  if (isValid) {
    Loading.show();
    try {
      await authResource.recoveryPassword(email.value as string);
      Notify.create({
        message: 'E-mail enviado com sucesso. Verifique seu e-mail para recuperar sua senha.',
        color: 'positive',
        icon: 'check_circle',
        position: 'top-right',
      });
    } catch (error) {
      showError(error);
    } finally {
      Loading.hide();
    }
  }
}

function goToLogin() {
  void router.push({ name: 'login' });
}

function goToDefineNewPassword() {
  void router.push({ name: 'define-new-password' });
}
</script>
