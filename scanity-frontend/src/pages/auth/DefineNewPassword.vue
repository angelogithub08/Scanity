<template>
  <div class="full-height flex column items-center justify-center">
    <q-card flat>
      <q-card-section>
        <div class="text-h6 text-center">
          <img :src="logo" alt="Scanity" width="200" />
        </div>
        <div class="text-center">Utilize seu código para redefinir sua senha.</div>
      </q-card-section>
      <q-card-section>
        <q-form ref="form" class="row q-col-gutter-md" @submit="updatePassword">
          <div class="col-12">
            <q-input v-model="code" :rules="[required]" lazy-rules label="Código" outlined>
              <template v-slot:prepend>
                <q-icon name="filter_1" color="primary" />
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input
              v-model="newPassword"
              :rules="[required, min6]"
              lazy-rules
              label="Nova Senha"
              outlined
              :type="showPassword ? 'text' : 'password'"
            >
              <template v-slot:prepend>
                <q-icon name="lock" color="primary" />
              </template>
              <template v-slot:append>
                <q-btn
                  flat
                  dense
                  rounded
                  icon="visibility"
                  color="primary"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input
              v-model="confirmNewPassword"
              label="Confirmar Nova Senha"
              outlined
              :type="showPassword ? 'text' : 'password'"
              :rules="[required, min6, isIqualToPassword]"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="lock" color="primary" />
              </template>
              <template v-slot:append>
                <q-btn
                  flat
                  dense
                  rounded
                  icon="visibility"
                  color="primary"
                  @click="showPassword = !showPassword"
                />
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
            <p color="text-primary">Já tenho o código</p>
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
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import logo from '/logo-bg-light.svg';

const router = useRouter();
const { required, min6 } = useValidation();
const authResource = useAuthResource();
const { showError } = useHandleException();

const code = ref<string | null>(null);
const newPassword = ref<string | null>(null);
const confirmNewPassword = ref<string | null>(null);
const showPassword = ref(false);
const form = ref<InstanceType<typeof QForm>>();

async function updatePassword() {
  const isValid = await form.value?.validate();
  if (isValid) {
    Loading.show();
    try {
      await authResource.newPassword({
        token: code.value as string,
        password: newPassword.value as string,
      });
      Notify.create({
        message: 'Senha atualizada com sucesso',
        color: 'positive',
        icon: 'check_circle',
        position: 'top-right',
      });
      void router.push({ name: 'login' });
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

function isIqualToPassword(value: string) {
  if (newPassword.value !== value) return 'Deve ser igual a senha';
  return true;
}

onMounted(() => {
  const token = router.currentRoute.value.query.token;
  if (token) {
    code.value = token as string;
  }
});
</script>
