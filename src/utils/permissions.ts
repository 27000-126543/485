import type { UserRole, ModuleName } from '../types'

type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve'

const rolePermissionMap: Record<UserRole, Record<ModuleName, PermissionAction[]>> = {
  hq_admin: {
    dashboard: ['view'],
    geology: ['view', 'create', 'edit', 'delete', 'approve'],
    drilling: ['view', 'create', 'edit', 'delete', 'approve'],
    production: ['view', 'create', 'edit', 'delete'],
    storage: ['view', 'create', 'edit', 'delete'],
    equipment: ['view', 'create', 'edit', 'delete'],
    safety: ['view', 'create', 'edit', 'delete', 'approve'],
    system: ['view', 'create', 'edit', 'delete'],
  },

  block_manager: {
    dashboard: ['view'],
    geology: ['view', 'create', 'edit'],
    drilling: ['view', 'create', 'edit', 'approve'],
    production: ['view', 'create', 'edit'],
    storage: ['view', 'create', 'edit', 'approve'],
    equipment: ['view', 'create', 'edit'],
    safety: ['view', 'create', 'edit', 'approve'],
    system: [],
  },

  chief_engineer: {
    dashboard: ['view'],
    geology: ['view', 'create', 'edit', 'approve'],
    drilling: ['view', 'create', 'edit', 'approve'],
    production: ['view'],
    storage: ['view'],
    equipment: ['view', 'edit'],
    safety: ['view'],
    system: [],
  },

  geologist: {
    dashboard: ['view'],
    geology: ['view', 'create', 'edit', 'approve'],
    drilling: ['view'],
    production: [],
    storage: [],
    equipment: [],
    safety: [],
    system: [],
  },

  supply_manager: {
    dashboard: ['view'],
    geology: ['view'],
    drilling: ['view', 'create', 'edit', 'approve'],
    production: [],
    storage: ['view', 'create', 'edit', 'approve'],
    equipment: ['view', 'create', 'edit'],
    safety: [],
    system: [],
  },

  team_leader: {
    dashboard: ['view'],
    geology: ['view'],
    drilling: [],
    production: ['view', 'create', 'edit'],
    storage: [],
    equipment: ['view', 'create', 'edit'],
    safety: ['view', 'create', 'edit'],
    system: [],
  },

  oil_worker: {
    dashboard: ['view'],
    geology: [],
    drilling: [],
    production: ['view', 'edit'],
    storage: [],
    equipment: ['view'],
    safety: ['view'],
    system: [],
  },

  drilling_engineer: {
    dashboard: ['view'],
    geology: ['view'],
    drilling: ['view', 'create', 'edit', 'approve'],
    production: ['view'],
    storage: ['view'],
    equipment: ['view', 'edit'],
    safety: ['view'],
    system: [],
  },

  storage_manager: {
    dashboard: ['view'],
    geology: [],
    drilling: ['view'],
    production: ['view'],
    storage: ['view', 'create', 'edit', 'approve'],
    equipment: ['view'],
    safety: ['view', 'create'],
    system: [],
  },

  maintenance_engineer: {
    dashboard: ['view'],
    geology: [],
    drilling: ['view'],
    production: ['view', 'edit'],
    storage: ['view'],
    equipment: ['view', 'create', 'edit', 'delete'],
    safety: ['view', 'edit'],
    system: [],
  },

  safety_officer: {
    dashboard: ['view'],
    geology: ['view'],
    drilling: ['view'],
    production: ['view'],
    storage: ['view'],
    equipment: ['view'],
    safety: ['view', 'create', 'edit', 'delete', 'approve'],
    system: [],
  },
}

const moduleDisplayNameMap: Record<ModuleName, string> = {
  dashboard: '首页大屏',
  geology: '地质勘探',
  drilling: '钻井调度',
  production: '采油监控',
  storage: '油品储运',
  equipment: '设备运维',
  safety: '安全环保',
  system: '系统管理',
}

const roleDisplayNameMap: Record<UserRole, string> = {
  hq_admin: '总部管理员',
  block_manager: '区块主管',
  chief_engineer: '总工程师',
  geologist: '地质专家',
  supply_manager: '物供经理',
  team_leader: '班组长',
  oil_worker: '采油工',
  drilling_engineer: '钻井工程师',
  storage_manager: '储运管理员',
  maintenance_engineer: '设备运维工程师',
  safety_officer: '安全员',
}

export function hasPermission(
  role: UserRole | null | undefined,
  moduleName: ModuleName,
  action: PermissionAction = 'view'
): boolean {
  if (!role) return false

  const modulePermissions = rolePermissionMap[role]?.[moduleName]
  if (!modulePermissions) return false

  return modulePermissions.includes(action)
}

export function hasAnyPermission(
  role: UserRole | null | undefined,
  moduleName: ModuleName
): boolean {
  if (!role) return false
  const modulePermissions = rolePermissionMap[role]?.[moduleName]
  return modulePermissions !== undefined && modulePermissions.length > 0
}

export function canAccessModule(
  role: UserRole | null | undefined,
  moduleName: ModuleName
): boolean {
  return hasPermission(role, moduleName, 'view')
}

export function getAccessibleModules(role: UserRole | null | undefined): ModuleName[] {
  if (!role) return []

  const permissionMap = rolePermissionMap[role]
  if (!permissionMap) return []

  return (Object.keys(permissionMap) as ModuleName[]).filter(
    (module) => hasAnyPermission(role, module)
  )
}

export function getModuleActions(
  role: UserRole | null | undefined,
  moduleName: ModuleName
): PermissionAction[] {
  if (!role) return []
  return rolePermissionMap[role]?.[moduleName] || []
}

export function getModuleDisplayName(moduleName: ModuleName): string {
  return moduleDisplayNameMap[moduleName] || moduleName
}

export function getRoleDisplayName(role: UserRole): string {
  return roleDisplayNameMap[role] || role
}

export function getAllModules(): ModuleName[] {
  return Object.keys(moduleDisplayNameMap) as ModuleName[]
}

export function getAllRoles(): UserRole[] {
  return Object.keys(roleDisplayNameMap) as UserRole[]
}

export { rolePermissionMap, moduleDisplayNameMap, roleDisplayNameMap }
export type { PermissionAction }
