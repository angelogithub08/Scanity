import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance, type AxiosError } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Para erro personalizado com propriedades do AxiosError
interface EnhancedError extends Error {
  response?: any;
  request?: any;
  config?: any;
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)

const API_URI = process.env.VITE_API_URI || 'http://localhost:3000';

const api = axios.create({ baseURL: API_URI });

// Interceptor de requisição
api.interceptors.request.use(
  (config) => {
    // Recupera o token do localStorage
    const token = localStorage.getItem('token');

    // Se o token existir, adiciona ao header de autorização
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(new Error(error));
  },
);

// Interceptor de resposta
api.interceptors.response.use(
  (response) => {
    // Verifica se a resposta contém um token e o armazena
    if (response.data) {
      // Verifica se o token veio como access_token ou token
      const token = response.data.access_token;
      if (token) {
        localStorage.setItem('token', token);
      }
    }

    return response;
  },
  (error: AxiosError) => {
    // Verifica se o erro é 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Remove o token do localStorage
      localStorage.clear();

      if (window.location.href.indexOf('auth') === -1) {
        // Redireciona para a página de login
        window.location.href = '/#/auth';
      }
    }

    // Criamos um erro personalizado com a mensagem original
    const enhancedError = new Error(error.message || 'Erro na requisição') as EnhancedError;

    // Copiamos propriedades importantes do erro original
    enhancedError.response = error.response;
    enhancedError.request = error.request;
    enhancedError.config = error.config;

    return Promise.reject(enhancedError);
  },
);

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api, axios, API_URI };
