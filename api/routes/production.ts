import { Router, type Response } from 'express'
import { store } from '../data/store.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { requirePermission, hasPermission } from '../middleware/rbac.js'
import type { WorkOrderType, WorkOrderPriority } from '../../shared/types.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('production', 'view'))

router.get('/wells', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { blockId, teamId, status } = req.query
    let wells = store.getWells()

    if (status) {
      wells = wells.filter((w) => w.status === status)
    }

    if (user.role === 'oil_worker') {
      wells = wells.filter((w) => w.workerId === user.id)
    } else if (user.role === 'team_leader') {
      if (user.teamId) {
        wells = wells.filter((w) => w.teamId === user.teamId)
      }
    } else if (user.role === 'block_manager' && user.blockId) {
      wells = wells.filter((w) => w.blockId === user.blockId)
    }

    if (blockId && user.role === 'hq_admin') {
      wells = wells.filter((w) => w.blockId === blockId)
    }
    if (teamId && (user.role === 'hq_admin' || user.role === 'block_manager')) {
      wells = wells.filter((w) => w.teamId === teamId)
    }

    res.json({
      success: true,
      data: wells,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取井口列表失败: ' + (err as Error).message,
    })
  }
})

router.get('/wells/:id/sensor-data', (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const well = store.findWellById(id)
    if (!well) {
      res.status(404).json({
        success: false,
        error: '井口不存在',
      })
      return
    }

    const user = req.user!
    if (user.role === 'oil_worker') {
      if (well.workerId !== user.id) {
        res.status(403).json({
          success: false,
          error: '无权访问此井口数据',
        })
        return
      }
    } else if (user.role === 'team_leader') {
      if (user.teamId && well.teamId !== user.teamId) {
        res.status(403).json({
          success: false,
          error: '无权访问此井口数据',
        })
        return
      }
    } else if (user.role === 'block_manager' && user.blockId && well.blockId !== user.blockId) {
      res.status(403).json({
        success: false,
        error: '无权访问此井口数据',
      })
      return
    }

    const data = store.getSensorDataByWellId(id, 20)
    res.json({
      success: true,
      data: {
        well,
        sensorData: data,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取传感器数据失败: ' + (err as Error).message,
    })
  }
})

router.get('/workorders', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { wellId, blockId, status, assigneeId } = req.query

    let orders = store.getWorkOrders()

    if (wellId) orders = orders.filter((o) => o.wellId === wellId)
    if (status) orders = orders.filter((o) => o.status === status)

    if (user.role === 'oil_worker') {
      orders = orders.filter((o) => o.assigneeId === user.id)
    } else if (user.role === 'team_leader') {
      if (user.teamId) {
        orders = orders.filter((o) => o.teamId === user.teamId)
      }
    } else if (user.role === 'block_manager' && user.blockId) {
      orders = orders.filter((o) => o.blockId === user.blockId)
    } else if (user.role === 'hq_admin') {
      if (blockId) orders = orders.filter((o) => o.blockId === blockId)
      if (assigneeId) orders = orders.filter((o) => o.assigneeId === assigneeId)
    }

    res.json({
      success: true,
      data: orders,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取工单列表失败: ' + (err as Error).message,
    })
  }
})

router.post('/workorders', requirePermission('production', 'create'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const {
      title,
      description,
      type,
      priority,
      wellId,
      equipmentId,
      blockId,
      teamId,
      assigneeId,
      startDate,
      dueDate,
    } = req.body

    if (!title || !blockId || !teamId || !assigneeId) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段: title, blockId, teamId, assigneeId',
      })
      return
    }

    const validTypes: WorkOrderType[] = ['production', 'maintenance', 'inspection', 'repair']
    const validPriorities: WorkOrderPriority[] = ['low', 'medium', 'high', 'urgent']

    if (type && !validTypes.includes(type)) {
      res.status(400).json({ success: false, error: '无效的工单类型' })
      return
    }
    if (priority && !validPriorities.includes(priority)) {
      res.status(400).json({ success: false, error: '无效的优先级' })
      return
    }

    const now = new Date()
    const workOrder = store.createWorkOrder({
      title,
      description: description || '',
      type: type || 'maintenance',
      priority: priority || 'medium',
      wellId,
      equipmentId,
      blockId,
      teamId,
      assigneeId,
      assignerId: user.id,
      startDate: startDate || now.toISOString(),
      dueDate: dueDate || new Date(now.getTime() + 3 * 86400000).toISOString(),
    })

    res.status(201).json({
      success: true,
      data: workOrder,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建工单失败: ' + (err as Error).message,
    })
  }
})

router.put('/workorders/:id/confirm', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { id } = req.params

    const order = store.findWorkOrderById(id)
    if (!order) {
      res.status(404).json({
        success: false,
        error: '工单不存在',
      })
      return
    }

    if (order.assigneeId !== user.id && !hasPermission(user.role, 'production', 'edit')) {
      res.status(403).json({
        success: false,
        error: '无权确认此工单',
      })
      return
    }

    if (order.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: '当前工单状态不可确认',
      })
      return
    }

    const updated = store.updateWorkOrder(id, {
      status: 'in_progress',
    })

    res.json({
      success: true,
      data: updated,
      message: '工单已确认接单',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '确认工单失败: ' + (err as Error).message,
    })
  }
})

router.put('/workorders/:id/complete', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { id } = req.params
    const { photoUrls, notes } = req.body

    const order = store.findWorkOrderById(id)
    if (!order) {
      res.status(404).json({
        success: false,
        error: '工单不存在',
      })
      return
    }

    if (order.assigneeId !== user.id && !hasPermission(user.role, 'production', 'edit')) {
      res.status(403).json({
        success: false,
        error: '无权完成此工单',
      })
      return
    }

    if (order.status !== 'in_progress') {
      res.status(400).json({
        success: false,
        error: '当前工单状态不可完成',
      })
      return
    }

    const updated = store.updateWorkOrder(id, {
      status: 'completed',
      completedDate: new Date().toISOString(),
      notes: notes || order.notes,
    })

    if (photoUrls && Array.isArray(photoUrls) && photoUrls.length > 0) {
      updated!.notes = (updated!.notes ? updated!.notes + '\n' : '') + '现场照片: ' + photoUrls.join(', ')
    }

    res.json({
      success: true,
      data: updated,
      message: '工单已完成',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '完成工单失败: ' + (err as Error).message,
    })
  }
})

export default router
