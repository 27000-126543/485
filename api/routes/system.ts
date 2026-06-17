import { Router, type Response } from 'express'
import { store } from '../data/store.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import type { UserRole, User } from '../../shared/types.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('system', 'view'))

const validRoles: UserRole[] = [
  'oil_worker',
  'team_leader',
  'block_manager',
  'hq_admin',
  'geologist',
  'chief_engineer',
  'supply_manager',
]

const sanitizeUser = (user: User): Omit<User, 'password'> => {
  const { password, ...safe } = user
  return safe
}

router.get('/users', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { role, blockId, status } = req.query

    let users = store.getUsers()

    if (role && validRoles.includes(role as UserRole)) {
      users = users.filter((u) => u.role === role)
    }
    if (status) {
      users = users.filter((u) => u.status === status)
    }

    if (user.role === 'block_manager' && user.blockId) {
      users = users.filter((u) => u.blockId === user.blockId)
    } else if (user.role !== 'hq_admin') {
      users = users.filter((u) => u.id === user.id)
    } else if (blockId) {
      users = users.filter((u) => u.blockId === blockId)
    }

    res.json({
      success: true,
      data: users.map(sanitizeUser),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取用户列表失败: ' + (err as Error).message,
    })
  }
})

router.post('/users', requirePermission('system', 'create'), (req: AuthRequest, res: Response): void => {
  try {
    const {
      username,
      password,
      name,
      role,
      phone,
      email,
      avatar,
      blockId,
      teamId,
      status,
    } = req.body

    if (!username || !password || !name || !role) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段: username, password, name, role',
      })
      return
    }

    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: '无效的角色',
      })
      return
    }

    if (store.findUserByUsername(username)) {
      res.status(409).json({
        success: false,
        error: '用户名已存在',
      })
      return
    }

    const user = store.createUser({
      username,
      password,
      name,
      role,
      phone: phone || '',
      email: email || '',
      avatar,
      blockId,
      teamId,
      status: status || 'active',
    })

    res.status(201).json({
      success: true,
      data: sanitizeUser(user),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建用户失败: ' + (err as Error).message,
    })
  }
})

router.put('/users/:id', requirePermission('system', 'edit'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { id } = req.params
    const { name, role, phone, email, avatar, blockId, teamId, status, password } = req.body

    if (!store.findUserById(id)) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      })
      return
    }

    if (role && !validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: '无效的角色',
      })
      return
    }

    if (user.role !== 'hq_admin' && id !== user.id) {
      res.status(403).json({
        success: false,
        error: '无权修改其他用户信息',
      })
      return
    }

    if (user.role === 'block_manager' && blockId && blockId !== user.blockId) {
      res.status(403).json({
        success: false,
        error: '无权修改其他区块用户',
      })
      return
    }

    const patch: Partial<User> = {}
    if (name !== undefined) patch.name = name
    if (role !== undefined && user.role === 'hq_admin') patch.role = role
    if (phone !== undefined) patch.phone = phone
    if (email !== undefined) patch.email = email
    if (avatar !== undefined) patch.avatar = avatar
    if (blockId !== undefined && user.role === 'hq_admin') patch.blockId = blockId
    if (teamId !== undefined) patch.teamId = teamId
    if (status !== undefined && (user.role === 'hq_admin' || id === user.id && status === 'active')) {
      patch.status = status
    }
    if (password) patch.password = password

    const updated = store.updateUser(id, patch)

    res.json({
      success: true,
      data: sanitizeUser(updated!),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '更新用户失败: ' + (err as Error).message,
    })
  }
})

router.delete('/users/:id', requirePermission('system', 'delete'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { id } = req.params

    if (!store.findUserById(id)) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      })
      return
    }

    if (id === user.id) {
      res.status(400).json({
        success: false,
        error: '不能删除自己',
      })
      return
    }

    const target = store.findUserById(id)!
    if (user.role === 'block_manager' && target.blockId !== user.blockId) {
      res.status(403).json({
        success: false,
        error: '无权删除其他区块用户',
      })
      return
    }

    const deleted = store.deleteUser(id)
    if (!deleted) {
      res.status(500).json({
        success: false,
        error: '删除失败',
      })
      return
    }

    res.json({
      success: true,
      message: '用户已删除',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '删除用户失败: ' + (err as Error).message,
    })
  }
})

router.get('/rules', (req: AuthRequest, res: Response): void => {
  try {
    const rules = store.getSystemRules()
    res.json({
      success: true,
      data: rules,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取规则配置失败: ' + (err as Error).message,
    })
  }
})

router.put('/rules', requirePermission('system', 'edit'), (req: AuthRequest, res: Response): void => {
  try {
    const {
      workOrderTimeoutHours,
      purchaseRequestTimeoutHours,
      alertAutoResolveHours,
      inspectionReminderDays,
      maintenanceReminderDays,
    } = req.body

    const patch: Partial<ReturnType<typeof store.getSystemRules>> = {}

    if (workOrderTimeoutHours !== undefined) {
      const n = Number(workOrderTimeoutHours)
      if (!Number.isFinite(n) || n <= 0) {
        res.status(400).json({ success: false, error: 'workOrderTimeoutHours 需为正数' })
        return
      }
      patch.workOrderTimeoutHours = n
    }
    if (purchaseRequestTimeoutHours !== undefined) {
      const n = Number(purchaseRequestTimeoutHours)
      if (!Number.isFinite(n) || n <= 0) {
        res.status(400).json({ success: false, error: 'purchaseRequestTimeoutHours 需为正数' })
        return
      }
      patch.purchaseRequestTimeoutHours = n
    }
    if (alertAutoResolveHours !== undefined) {
      const n = Number(alertAutoResolveHours)
      if (!Number.isFinite(n) || n <= 0) {
        res.status(400).json({ success: false, error: 'alertAutoResolveHours 需为正数' })
        return
      }
      patch.alertAutoResolveHours = n
    }
    if (inspectionReminderDays !== undefined) {
      const n = Number(inspectionReminderDays)
      if (!Number.isFinite(n) || n <= 0) {
        res.status(400).json({ success: false, error: 'inspectionReminderDays 需为正数' })
        return
      }
      patch.inspectionReminderDays = n
    }
    if (maintenanceReminderDays !== undefined) {
      const n = Number(maintenanceReminderDays)
      if (!Number.isFinite(n) || n <= 0) {
        res.status(400).json({ success: false, error: 'maintenanceReminderDays 需为正数' })
        return
      }
      patch.maintenanceReminderDays = n
    }

    if (Object.keys(patch).length === 0) {
      res.status(400).json({
        success: false,
        error: '未提供任何要更新的规则字段',
      })
      return
    }

    const updated = store.updateSystemRules(patch)

    res.json({
      success: true,
      data: updated,
      message: '规则配置已更新',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '更新规则配置失败: ' + (err as Error).message,
    })
  }
})

export default router
