import type { DirectiveBinding } from 'vue';
import { watch } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { usePermissions } from 'src/composables/usePermissions';

interface PermissionElement extends HTMLElement {
  _originalDisplay?: string;
  _originalVisibility?: string;
  _permissionBinding?: PermissionDirectiveBinding;
  _permissionStop?: () => void;
}

export interface PermissionDirectiveBinding extends DirectiveBinding {
  value:
    | string
    | string[]
    | {
        permission?: string | string[];
        mode?: 'hide' | 'disable' | 'remove';
        fallback?: string;
      };
}

/**
 * Diretiva v-permission para controlar visibilidade baseada em permissões
 *
 * ⚠️ IMPORTANTE: Esta diretiva usa acesso DIRETO ao permissionsMap para evitar
 * loops infinitos com computed properties que também usam hasAnyPermission.
 *
 * Não usar hasPermission() ou hasAnyPermission() aqui para evitar dependência circular!
 *
 * Uso básico:
 * v-permission="'USERS_LIST'"
 * v-permission="['USERS_LIST', 'USERS_CREATE']"
 *
 * Uso avançado:
 * v-permission="{ permission: 'USERS_DELETE', mode: 'disable' }"
 * v-permission="{ permission: ['USERS_LIST'], mode: 'remove', fallback: 'Sem permissão' }"
 */
export const vPermission = {
  mounted(el: PermissionElement, binding: PermissionDirectiveBinding) {
    el._permissionBinding = binding;
    // Reaplicar quando as permissões forem carregadas no auth store (ex.: após MainLayout onBeforeMount)
    const authStore = useAuthStore();
    el._permissionStop = watch(
      () => authStore.permissions,
      () => {
        const currentBinding = el._permissionBinding;
        if (currentBinding) checkPermission(el, currentBinding);
      },
      { deep: true },
    );
    checkPermission(el, binding);
  },

  updated(el: PermissionElement, binding: PermissionDirectiveBinding) {
    el._permissionBinding = binding;
    checkPermission(el, binding);
  },

  beforeUnmount(el: PermissionElement) {
    el._permissionStop?.();
    delete el._originalDisplay;
    delete el._originalVisibility;
    delete el._permissionBinding;
    delete el._permissionStop;
  },
};

function checkPermission(el: PermissionElement, binding: PermissionDirectiveBinding) {
  const { permissionsMap } = usePermissions();

  // Salvar estilos originais na primeira execução
  if (el._originalDisplay === undefined) {
    el._originalDisplay = el.style.display || '';
  }
  if (el._originalVisibility === undefined) {
    el._originalVisibility = el.style.visibility || '';
  }

  // Processar valor da diretiva
  let permissions: string | string[] = '';
  let mode: 'hide' | 'disable' | 'remove' = 'hide';
  let fallback: string = '';

  if (typeof binding.value === 'string') {
    permissions = binding.value;
  } else if (Array.isArray(binding.value)) {
    permissions = binding.value;
  } else if (typeof binding.value === 'object' && binding.value !== null) {
    permissions = binding.value.permission || '';
    mode = binding.value.mode || 'hide';
    fallback = binding.value.fallback || '';
  }

  // Verificar permissão DIRETAMENTE no Map (sem cache, sem logs, sem loops)
  let hasAccess = false;
  const currentPermissionsMap = permissionsMap.value;

  if (typeof permissions === 'string') {
    hasAccess = currentPermissionsMap.has(permissions);
  } else if (Array.isArray(permissions)) {
    hasAccess = permissions.some((key) => currentPermissionsMap.has(key));
  }

  // Aplicar ação baseada no resultado
  if (hasAccess) {
    restoreElement(el, mode);
  } else {
    restrictElement(el, mode, fallback);
  }
}

function restoreElement(el: PermissionElement, mode: string) {
  switch (mode) {
    case 'hide':
      el.style.display = el._originalDisplay || '';
      el.style.visibility = el._originalVisibility || '';
      break;

    case 'disable':
      if (
        el.tagName === 'INPUT' ||
        el.tagName === 'BUTTON' ||
        el.tagName === 'SELECT' ||
        el.tagName === 'TEXTAREA'
      ) {
        (el as any).disabled = false;
      }
      el.style.pointerEvents = '';
      el.style.opacity = '';
      break;

    case 'remove':
      if (el.parentNode && el.style.display === 'none') {
        el.style.display = el._originalDisplay || '';
      }
      break;
  }

  // Remover classes de estado
  el.classList.remove('permission-denied', 'permission-disabled');
}

function restrictElement(el: PermissionElement, mode: string, fallback: string) {
  switch (mode) {
    case 'hide':
      el.style.display = 'none';
      break;

    case 'disable':
      if (
        el.tagName === 'INPUT' ||
        el.tagName === 'BUTTON' ||
        el.tagName === 'SELECT' ||
        el.tagName === 'TEXTAREA'
      ) {
        (el as any).disabled = true;
      }
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.5';
      el.classList.add('permission-disabled');

      // Adicionar title com explicação se não existir
      if (!el.title && fallback) {
        el.title = fallback;
      }
      break;

    case 'remove':
      el.style.display = 'none';
      if (fallback && el.parentNode) {
        // Criar elemento de fallback se não existir
        let fallbackEl = el.parentNode.querySelector('.permission-fallback') as HTMLElement;
        if (!fallbackEl) {
          fallbackEl = document.createElement('span');
          fallbackEl.className = 'permission-fallback text-grey-6';
          fallbackEl.textContent = fallback;
          el.parentNode.insertBefore(fallbackEl, el);
        }
      }
      break;
  }

  el.classList.add('permission-denied');
}

interface HasPermissionElement extends HTMLElement {
  _hasPermissionKey?: string;
  _hasPermissionStop?: () => void;
}

function applyHasPermission(el: HasPermissionElement, key: string) {
  const { permissionsMap } = usePermissions();
  if (permissionsMap.value.has(key)) {
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

// Versão simplificada para casos básicos
export const vHasPermission = {
  mounted(el: HasPermissionElement, binding: DirectiveBinding<string>) {
    el._hasPermissionKey = binding.value;
    const authStore = useAuthStore();
    el._hasPermissionStop = watch(
      () => authStore.permissions,
      () => applyHasPermission(el, el._hasPermissionKey ?? binding.value),
      { deep: true },
    );
    applyHasPermission(el, binding.value);
  },

  updated(el: HasPermissionElement, binding: DirectiveBinding<string>) {
    el._hasPermissionKey = binding.value;
    applyHasPermission(el, binding.value);
  },

  beforeUnmount(el: HasPermissionElement) {
    el._hasPermissionStop?.();
    delete el._hasPermissionKey;
    delete el._hasPermissionStop;
  },
};

// Diretiva para mostrar apenas se NÃO tiver permissão (útil para mensagens de erro)
interface NoPermissionElement extends HTMLElement {
  _noPermissionKey?: string;
  _noPermissionStop?: () => void;
}

function applyNoPermission(el: NoPermissionElement, key: string) {
  const { permissionsMap } = usePermissions();
  if (permissionsMap.value.has(key)) {
    el.style.display = 'none';
  } else {
    el.style.display = '';
  }
}

export const vNoPermission = {
  mounted(el: NoPermissionElement, binding: DirectiveBinding<string>) {
    el._noPermissionKey = binding.value;
    const authStore = useAuthStore();
    el._noPermissionStop = watch(
      () => authStore.permissions,
      () => applyNoPermission(el, el._noPermissionKey ?? binding.value),
      { deep: true },
    );
    applyNoPermission(el, binding.value);
  },

  updated(el: NoPermissionElement, binding: DirectiveBinding<string>) {
    el._noPermissionKey = binding.value;
    applyNoPermission(el, binding.value);
  },

  beforeUnmount(el: NoPermissionElement) {
    el._noPermissionStop?.();
    delete el._noPermissionKey;
    delete el._noPermissionStop;
  },
};
