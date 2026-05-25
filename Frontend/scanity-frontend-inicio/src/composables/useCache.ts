import { ref } from 'vue';

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

// Cache compartilhado entre todas as instâncias
const globalCache = ref<Record<string, Record<string, CacheItem<any>>>>({});

export function useCache<T = any>(namespace = 'default', ttl = 60000) {
  // Garante que o namespace existe no cache global
  if (!globalCache.value[namespace]) {
    globalCache.value[namespace] = {};
  }

  // Referência ao cache deste namespace
  const cache = globalCache.value[namespace];

  // Limpa itens expirados
  function cleanup() {
    const now = Date.now();
    Object.keys(cache).forEach((key) => {
      const item = cache[key];
      if (item && item.expiresAt < now) {
        delete cache[key];
      }
    });
  }

  function set(key: string, value: T, customTtl?: number) {
    const expiresAt = Date.now() + (customTtl ?? ttl);
    cache[key] = { value, expiresAt };
  }

  function get(key: string): T | undefined {
    cleanup();
    const item = cache[key];
    if (!item) {
      console.log(`[Cache][${namespace}] Miss: ${key}`);
      return undefined;
    }
    if (item.expiresAt < Date.now()) {
      console.log(`[Cache][${namespace}] Expired: ${key}`);
      delete cache[key];
      return undefined;
    }
    console.log(`[Cache][${namespace}] Hit: ${key}`);
    return item.value;
  }

  function remove(key: string) {
    delete cache[key];
    console.log(`[Cache][${namespace}] Removed: ${key}`);
  }

  function clear() {
    Object.keys(cache).forEach((key) => {
      delete cache[key];
    });
    console.log(`[Cache][${namespace}] Cleared all`);
  }

  return { get, set, remove, clear };
}
