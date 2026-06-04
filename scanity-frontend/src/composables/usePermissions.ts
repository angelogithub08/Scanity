import type { ComputedRef } from 'vue';
import { computed, ref, watch } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import type {
  ModuleCRUDPermissions,
  Permission,
  PermissionGroup,
  PermissionKey,
} from 'src/interfaces/permissions';
import { buildPermissionKey, PERMISSION_ACTIONS } from 'src/constants/permissions';

// Cache global para validações de permissão
const permissionCache = new Map<string, boolean>();
const cacheStats = ref({ hits: 0, misses: 0 });

// Sistema de logs para debug
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Contador para detectar loops infinitos
const callCounts = new Map<string, number>();
const MAX_CALLS_PER_FUNCTION = 100;

// Flag para evitar chamadas recursivas
const executingFunctions = new Set<string>();

function debugLog(action: string, key?: string, result?: boolean, extra?: any) {
  if (!DEBUG_MODE) return;

  const timestamp = new Date().toISOString();
  const message = `[Permissions] ${timestamp} - ${action}${key ? ` (${key})` : ''}${result !== undefined ? ` = ${result}` : ''}`;

  console.log(message, extra || '');
}

// Função para detectar possíveis loops infinitos
function checkForInfiniteLoop(functionName: string) {
  if (!DEBUG_MODE) return;

  const currentCount = callCounts.get(functionName) || 0;
  const newCount = currentCount + 1;
  callCounts.set(functionName, newCount);

  if (newCount > MAX_CALLS_PER_FUNCTION) {
    console.warn(`⚠️ POSSÍVEL LOOP INFINITO detectado em ${functionName}: ${newCount} chamadas!`);
    console.trace('Stack trace do possível loop:');
  }

  // Reset contador a cada 200ms para permitir uso normal
  setTimeout(() => {
    callCounts.set(functionName, 0);
  }, 200);
}

export function usePermissions() {
  const authStore = useAuthStore();

  // Computed reativo das permissões do usuário
  const userPermissions: ComputedRef<Partial<Permission>[]> = computed(() => authStore.permissions);

  // Limpar cache quando as permissões mudarem
  watch(
    userPermissions,
    (newPermissions, oldPermissions) => {
      // Só limpar cache se realmente houve mudança no array ou no conteúdo
      if (newPermissions !== oldPermissions) {
        // Verificar se o conteúdo realmente mudou (comparação básica)
        const hasContentChanged =
          !oldPermissions ||
          newPermissions.length !== oldPermissions.length ||
          newPermissions.some(
            (perm, index) =>
              !oldPermissions[index] ||
              perm.key !== oldPermissions[index].key ||
              perm.key_group !== oldPermissions[index].key_group,
          );

        if (hasContentChanged) {
          permissionCache.clear();
          executingFunctions.clear(); // Limpar flags de execução também
          cacheStats.value = { hits: 0, misses: 0 };
          debugLog('Cache cleared - permissions content changed', undefined, undefined, {
            oldCount: oldPermissions?.length || 0,
            newCount: newPermissions?.length || 0,
          });
        } else {
          debugLog('Permissions array reference changed but content is same - cache preserved');
        }
      }
    },
    { flush: 'sync' }, // Usar flush: sync para evitar loops
  );

  // Mapa de permissões para acesso O(1)
  const permissionsMap: ComputedRef<Map<string, Permission>> = computed(() => {
    const map = new Map<string, Permission>();
    userPermissions.value.forEach((permission) => {
      if (permission.key) {
        map.set(permission.key, permission as Permission);
      }
    });
    return map;
  });

  // Mapa de grupos de permissões para acesso rápido
  const permissionsByGroup: ComputedRef<Map<string, Permission[]>> = computed(() => {
    const map = new Map<string, Permission[]>();
    userPermissions.value.forEach((permission) => {
      if (permission.key_group) {
        if (!map.has(permission.key_group)) {
          map.set(permission.key_group, []);
        }
        map.get(permission.key_group)?.push(permission as Permission);
      }
    });
    return map;
  });

  /**
   * Verifica se o usuário tem uma permissão específica (com cache)
   * @param key - Chave da permissão (ex: 'USERS_LIST')
   * @returns boolean
   */
  function hasPermission(key: PermissionKey): boolean {
    checkForInfiniteLoop('hasPermission');

    if (!key) {
      debugLog('Permission check failed', key, false, 'Empty key');
      return false;
    }

    // Verificar cache primeiro
    const cacheKey = `perm_${key}`;
    if (permissionCache.has(cacheKey)) {
      cacheStats.value.hits++;
      const result = permissionCache.get(cacheKey)!;
      debugLog('Permission check (cached)', key, result);
      return result;
    }

    // Calcular e armazenar no cache
    cacheStats.value.misses++;
    const result = permissionsMap.value.has(key);
    permissionCache.set(cacheKey, result);

    debugLog('Permission check (computed)', key, result);
    return result;
  }

  /**
   * Verifica se o usuário tem qualquer uma das permissões fornecidas (OR)
   * @param keys - Array de chaves de permissões
   * @returns boolean
   */
  function hasAnyPermission(keys: PermissionKey[]): boolean {
    checkForInfiniteLoop('hasAnyPermission');

    if (!keys || keys.length === 0) {
      debugLog('hasAnyPermission called with empty/null keys', undefined, false);
      return false;
    }

    // Criar cópia para evitar mutação do array original
    const sortedKeys = [...keys].sort();
    const cacheKey = `any_${sortedKeys.join('|')}`;

    // Verificar se já está executando esta validação para evitar recursão
    if (executingFunctions.has(cacheKey)) {
      debugLog('hasAnyPermission: recursion avoided', cacheKey, false);
      return false;
    }

    if (permissionCache.has(cacheKey)) {
      cacheStats.value.hits++;
      const result = permissionCache.get(cacheKey)!;
      debugLog('hasAnyPermission (cached)', cacheKey, result);
      return result;
    }

    // Marcar como executando
    executingFunctions.add(cacheKey);

    try {
      // Calcular resultado sem usar hasPermission para evitar loops
      cacheStats.value.misses++;
      const currentPermissionsMap = permissionsMap.value;
      const result = sortedKeys.some((key) => currentPermissionsMap.has(key));

      permissionCache.set(cacheKey, result);
      debugLog('hasAnyPermission (computed)', cacheKey, result, { keys: sortedKeys });
      return result;
    } finally {
      // Sempre remover da lista de execução
      executingFunctions.delete(cacheKey);
    }
  }

  /**
   * Verifica se o usuário tem todas as permissões fornecidas (AND)
   * @param keys - Array de chaves de permissões
   * @returns boolean
   */
  function hasAllPermissions(keys: PermissionKey[]): boolean {
    checkForInfiniteLoop('hasAllPermissions');

    if (!keys || keys.length === 0) {
      debugLog('hasAllPermissions called with empty/null keys', undefined, false);
      return false;
    }

    // Criar cópia para evitar mutação do array original
    const sortedKeys = [...keys].sort();
    const cacheKey = `all_${sortedKeys.join('|')}`;

    // Verificar se já está executando esta validação para evitar recursão
    if (executingFunctions.has(cacheKey)) {
      debugLog('hasAllPermissions: recursion avoided', cacheKey, false);
      return false;
    }

    if (permissionCache.has(cacheKey)) {
      cacheStats.value.hits++;
      const result = permissionCache.get(cacheKey)!;
      debugLog('hasAllPermissions (cached)', cacheKey, result);
      return result;
    }

    // Marcar como executando
    executingFunctions.add(cacheKey);

    try {
      // Calcular resultado sem usar hasPermission para evitar loops
      cacheStats.value.misses++;
      const currentPermissionsMap = permissionsMap.value;
      const result = sortedKeys.every((key) => currentPermissionsMap.has(key));

      permissionCache.set(cacheKey, result);
      debugLog('hasAllPermissions (computed)', cacheKey, result, { keys: sortedKeys });
      return result;
    } finally {
      // Sempre remover da lista de execução
      executingFunctions.delete(cacheKey);
    }
  }

  /**
   * Verifica se o usuário tem qualquer permissão de um grupo específico
   * @param keyGroup - Grupo de permissões (ex: 'USERS')
   * @returns boolean
   */
  function hasAnyPermissionInGroup(keyGroup: PermissionGroup): boolean {
    if (!keyGroup) return false;
    const groupPermissions = permissionsByGroup.value.get(keyGroup);
    return groupPermissions ? groupPermissions.length > 0 : false;
  }

  /**
   * Verifica se o usuário tem todas as permissões específicas de um grupo
   * @param keyGroup - Grupo de permissões
   * @param keys - Array de chaves específicas do grupo
   * @returns boolean
   */
  function hasAllPermissionsInGroup(keyGroup: PermissionGroup, keys: string[]): boolean {
    if (!keyGroup || !keys || keys.length === 0) return false;
    const fullKeys = keys.map((key) => buildPermissionKey(keyGroup, key));
    return hasAllPermissions(fullKeys);
  }

  /**
   * Verifica se o usuário pode listar registros de um módulo
   * @param module - Nome do módulo (ex: 'USERS')
   * @returns boolean
   */
  function canList(module: string): boolean {
    return hasPermission(buildPermissionKey(module, PERMISSION_ACTIONS.LIST));
  }

  /**
   * Verifica se o usuário pode criar registros de um módulo
   * @param module - Nome do módulo (ex: 'USERS')
   * @returns boolean
   */
  function canCreate(module: string): boolean {
    return hasPermission(buildPermissionKey(module, PERMISSION_ACTIONS.CREATE));
  }

  /**
   * Verifica se o usuário pode editar registros de um módulo
   * @param module - Nome do módulo (ex: 'USERS')
   * @returns boolean
   */
  function canUpdate(module: string): boolean {
    return hasPermission(buildPermissionKey(module, PERMISSION_ACTIONS.UPDATE));
  }

  /**
   * Verifica se o usuário pode excluir registros de um módulo
   * @param module - Nome do módulo (ex: 'USERS')
   * @returns boolean
   */
  function canDelete(module: string): boolean {
    return hasPermission(buildPermissionKey(module, PERMISSION_ACTIONS.DELETE));
  }

  /**
   * Retorna todas as permissões CRUD de um módulo
   * @param module - Nome do módulo (ex: 'USERS')
   * @returns ModuleCRUDPermissions
   */
  function getModuleCRUDPermissions(module: string): ModuleCRUDPermissions {
    return {
      canList: canList(module),
      canCreate: canCreate(module),
      canUpdate: canUpdate(module),
      canDelete: canDelete(module),
    };
  }

  /**
   * Lista todas as permissões em falta de um array fornecido
   * @param keys - Array de chaves de permissões para verificar
   * @returns Array com as permissões em falta
   */
  function getMissingPermissions(keys: PermissionKey[]): PermissionKey[] {
    if (!keys || keys.length === 0) return [];
    return keys.filter((key) => !hasPermission(key));
  }

  /**
   * Lista todas as permissões disponíveis de um grupo
   * @param keyGroup - Grupo de permissões
   * @returns Array com as permissões do grupo
   */
  function getGroupPermissions(keyGroup: PermissionGroup): Permission[] {
    if (!keyGroup) return [];
    return permissionsByGroup.value.get(keyGroup) || [];
  }

  /**
   * Verifica se o usuário é "super admin" (tem acesso a todas as permissões básicas)
   * @returns boolean
   */
  function isSuperAdmin(): boolean {
    const requiredPermissions = [
      'USERS_LIST',
      'USERS_CREATE',
      'USERS_UPDATE',
      'USERS_DELETE',
      'PROFILES_LIST',
      'PROFILES_CREATE',
      'PROFILES_UPDATE',
      'PROFILES_DELETE',
      'PERMISSIONS_LIST',
      'PERMISSIONS_CREATE',
      'PERMISSIONS_UPDATE',
      'PERMISSIONS_DELETE',
    ];
    return hasAllPermissions(requiredPermissions);
  }

  /**
   * Obtém estatísticas das permissões do usuário
   * @returns Objeto com estatísticas
   */
  function getPermissionStats() {
    const totalPermissions = userPermissions.value.length;
    const groupsCount = permissionsByGroup.value.size;
    const groupsWithPermissions = Array.from(permissionsByGroup.value.keys());

    return {
      totalPermissions,
      groupsCount,
      groupsWithPermissions,
      isEmpty: totalPermissions === 0,
      hasAdminAccess: isSuperAdmin(),
    };
  }

  /**
   * Limpa o cache de permissões manualmente
   */
  function clearCache(): void {
    permissionCache.clear();
    executingFunctions.clear();
    cacheStats.value = { hits: 0, misses: 0 };
    debugLog('Cache manually cleared');
  }

  /**
   * Obtém estatísticas do cache
   */
  function getCacheStats() {
    const total = cacheStats.value.hits + cacheStats.value.misses;
    const hitRate = total > 0 ? (cacheStats.value.hits / total) * 100 : 0;

    return {
      hits: cacheStats.value.hits,
      misses: cacheStats.value.misses,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: permissionCache.size,
    };
  }

  /**
   * Habilita/desabilita logs de debug
   */
  function toggleDebugMode(enabled?: boolean): void {
    // Note: DEBUG_MODE é baseado em NODE_ENV, mas podemos adicionar controle runtime no futuro
    debugLog(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  return {
    // Propriedades reativas
    userPermissions,
    permissionsMap,
    permissionsByGroup,

    // Métodos de validação
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyPermissionInGroup,
    hasAllPermissionsInGroup,

    // Helpers CRUD
    canList,
    canCreate,
    canUpdate,
    canDelete,
    getModuleCRUDPermissions,

    // Utilitários avançados
    getMissingPermissions,
    getGroupPermissions,
    isSuperAdmin,
    getPermissionStats,

    // Cache e Debug
    clearCache,
    getCacheStats,
    toggleDebugMode,
  };
}
