import { usePermissions } from 'src/composables/usePermissions';
import { vHasPermission, vNoPermission, vPermission } from 'src/directives/vPermission';
import type { App } from 'vue';

// Tipagem para as propriedades globais
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $permissions: ReturnType<typeof usePermissions>;
    $hasPermission: (key: string) => boolean;
    $canCreate: (module: string) => boolean;
    $canUpdate: (module: string) => boolean;
    $canDelete: (module: string) => boolean;
    $canList: (module: string) => boolean;
  }
}

export interface PermissionsPluginOptions {
  /**
   * Prefixo para as diretivas (padrão: '')
   * Ex: com prefixo 'app' seria v-app-permission
   */
  directivePrefix?: string;

  /**
   * Se deve registrar propriedades globais (padrão: true)
   */
  globalProperties?: boolean;

  /**
   * Se deve registrar as diretivas (padrão: true)
   */
  directives?: boolean;

  /**
   * Se deve habilitar logs de debug (padrão: false)
   */
  debug?: boolean;
}

/**
 * Plugin para integração global do sistema de permissões
 *
 * Uso no main.ts:
 * app.use(PermissionsPlugin)
 *
 * Ou com opções:
 * app.use(PermissionsPlugin, {
 *   directivePrefix: 'app',
 *   debug: true
 * })
 */
export const PermissionsPlugin = {
  install(app: App, options: PermissionsPluginOptions = {}) {
    const {
      directivePrefix = '',
      globalProperties = true,
      directives = true,
      debug = false,
    } = options;

    // Registrar diretivas
    if (directives) {
      const prefix = directivePrefix ? `${directivePrefix}-` : '';

      app.directive(`${prefix}permission`, vPermission);
      app.directive(`${prefix}has-permission`, vHasPermission);
      app.directive(`${prefix}no-permission`, vNoPermission);

      if (debug) {
        console.log(`[PermissionsPlugin] Diretivas registradas com prefixo "${prefix}"`);
      }
    }

    // Registrar propriedades globais
    if (globalProperties) {
      const permissions = usePermissions();

      // Instância completa do composable
      app.config.globalProperties.$permissions = permissions;

      // Atalhos para funções mais usadas
      app.config.globalProperties.$hasPermission = permissions.hasPermission;
      app.config.globalProperties.$canCreate = permissions.canCreate;
      app.config.globalProperties.$canUpdate = permissions.canUpdate;
      app.config.globalProperties.$canDelete = permissions.canDelete;
      app.config.globalProperties.$canList = permissions.canList;

      if (debug) {
        console.log('[PermissionsPlugin] Propriedades globais registradas');
      }
    }

    // Provide/inject para uso em composables
    app.provide('permissions', usePermissions());

    if (debug) {
      console.log('[PermissionsPlugin] Plugin instalado com sucesso', {
        directivePrefix,
        globalProperties,
        directives,
      });
    }
  },
};

export default PermissionsPlugin;
