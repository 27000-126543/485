import { Router, type Request, type Response } from 'express'
import { store } from '../data/store.js'
import type { User, UserRole } from '../../shared/types.js'

const router = Router()

interface SafeUser extends Omit<User, 'password'> {}

const sanitizeUser = (user: User): SafeUser => {
  const { password, ...safe } = user
  return safe
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, name, role, phone, email, blockId, teamId } = req.body

    if (!username || !password || !name || !role) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段: username, password, name, role',
      })
      return
    }

    const validRoles: UserRole[] = [
      'oil_worker',
      'team_leader',
      'block_manager',
      'hq_admin',
      'geologist',
      'chief_engineer',
      'supply_manager',
    ]
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
      blockId,
      teamId,
      status: 'active',
    })

    res.status(201).json({
      success: true,
      data: sanitizeUser(user),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '注册失败: ' + (err as Error).message,
    })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '缺少用户名或密码',
      })
      return
    }

    const user = store.findUserByUsername(username)
    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      })
      return
    }

    if (user.password !== password) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      })
      return
    }

    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        error: '账号已被禁用，请联系管理员',
      })
      return
    }

    const token = store.createToken(user.id)

    res.json({
      success: true,
      data: {
        token: token.token,
        expiresAt: token.expiresAt,
        user: sanitizeUser(user),
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '登录失败: ' + (err as Error).message,
    })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (token) {
      store.revokeToken(token)
    }

    res.json({
      success: true,
      message: '已成功登出',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '登出失败: ' + (err as Error).message,
    })
  }
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      res.status(401).json({
        success: false,
        error: '未登录',
      })
      return
    }

    const user = store.getUserByToken(token)
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Token 无效或已过期',
      })
      return
    }

    res.json({
      success: true,
      data: sanitizeUser(user),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败: ' + (err as Error).message,
    })
  }
})

export default router
