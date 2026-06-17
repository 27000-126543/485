import type { Request, Response, NextFunction } from 'express'
import { store } from '../data/store.js'
import type { User } from '../../shared/types.js'

export interface AuthRequest extends Request {
  user?: User
  token?: string
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: '缺少 Authorization 头',
    })
    return
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

  if (!token) {
    res.status(401).json({
      success: false,
      error: '无效的 Authorization 格式',
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

  if (user.status !== 'active') {
    res.status(403).json({
      success: false,
      error: '账号已被禁用',
    })
    return
  }

  req.user = user
  req.token = token
  next()
}

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    if (token) {
      const user = store.getUserByToken(token)
      if (user && user.status === 'active') {
        req.user = user
        req.token = token
      }
    }
  }
  next()
}
