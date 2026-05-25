import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Token } from 'src/interfaces/tokens';
import { ref } from 'vue';

export const useTokensStore = defineStore('tokens', () => {
  const currentToken = ref<Partial<Token>>();
  const tokens = ref<Partial<Token>[]>([]);

  function setCurrentToken(data: Partial<Token>) {
    currentToken.value = data;
  }

  function setTokens(data: Partial<Token>[]) {
    tokens.value = data;
  }

  return { tokens, setTokens, currentToken, setCurrentToken };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTokensStore, import.meta.hot));
}
