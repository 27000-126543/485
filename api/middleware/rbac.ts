import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth.js'
import type { UserRole, ModuleName } from '../../shared/types.js'

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
    drilling: ['view', 'create', 'edit'],
    production: ['view'],
    storage: [],
    equipment: ['view', 'edit'],
    safety: ['view'],
    system: [],
  },
  storage_manager: {
    dashboard: ['view'],
    geology: [],
    drilling: ['view'],
    production: [],
    storage: ['view', 'create', 'edit', 'approve'],
    equipment: ['view'],
    safety: ['view'],
    system: [],
  },
  maintenance_engineer: {
    dashboard: ['view'],
    geology: [],
    drilling: ['view'],
    production: ['view'],
    storage: [],
    equipment: ['view', 'create', 'edit'],
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
    safety: ['view', 'create', 'edit', 'approve'],
    system: [],
  },
}

export const hasPermission = (
  role: UserRole | null | undefined,
  moduleName: ModuleName,
  action: PermissionAction = 'view'
): boolean => {
  if (!role) return false
  const modulePermissions = rolePermissionMap[role]?.[moduleName]
  if (!modulePermissions) return false
  return modulePermissions.includes(action)
}

export const requirePermission = (
  moduleName: ModuleName,
  action: PermissionAction = 'view'
) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未登录',
      })
      return
    }

    if (!hasPermission(req.user.role, moduleName, action)) {
      res.status(403).json({
        success: false,
        error: `无权访问此模块: ${moduleName}, 需要权限: ${action}`,
      })
      return
    }

    next()
  }
}

export const requireModuleAccess = (moduleName: ModuleName) => {
  return requirePermission(moduleName, 'view')
}

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未登录',
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: '角色权限不足',
      })
      return
    }

    next()
  }
}

export { rolePermissionMap }
export type { PermissionAction }
