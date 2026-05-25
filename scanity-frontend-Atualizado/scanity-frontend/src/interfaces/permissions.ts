export interface Permission {
  id?: string | null;
  name: string | null;
  key_group: string | null;
  key: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PermissionKey = string;
export type PermissionGroup = string;

export interface PermissionCheck {
  key: PermissionKey;
  hasPermission: boolean;
}

export interface ModuleCRUDPermissions {
  canList: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}
