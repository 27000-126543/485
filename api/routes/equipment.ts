import { Router, type Response } from 'express'
import { store } from '../data/store.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { requirePermission, hasPermission } from '../middleware/rbac.js'
import type { RepairOrderPriority, RepairFaultType } from '../../shared/types.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('equipment', 'view'))

router.get('/equipment', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { blockId, category, status, wellId } = req.query

    let equipment = store.getEquipment()

    if (category) equipment = equipment.filter((e) => e.category === category)
    if (status) equipment = equipment.filter((e) => e.status === status)
    if (wellId) equipment = equipment.filter((e) => e.wellId === wellId)

    if ((user.role === 'block_manager' || user.role === 'team_leader' || user.role === 'oil_worker') && user.blockId) {
      equipment = equipment.filter((e) => e.blockId === user.blockId)
    } else if (blockId && user.role === 'hq_admin') {
      equipment = equipment.filter((e) => e.blockId === blockId)
    }

    res.json({
      success: true,
      data: equipment,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取设备列表失败: ' + (err as Error).message,
    })
  }
})

router.get('/inspection-plans', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { blockId, status, assigneeId } = req.query

    let plans = store.getInspectionPlans()

    if (status) plans = plans.filter((p) => p.status === status)
    if (assigneeId) plans = plans.filter((p) => p.assigneeId === assigneeId)

    if ((user.role === 'block_manager' || user.role === 'team_leader') && user.blockId) {
      plans = plans.filter((p) => p.blockId === user.blockId)
    } else if (user.role === 'oil_worker') {
      plans = plans.filter((p) => p.assigneeId === user.id)
    } else if (blockId && user.role === 'hq_admin') {
      plans = plans.filter((p) => p.blockId === blockId)
    }

    res.json({
      success: true,
      data: plans,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取巡检计划失败: ' + (err as Error).message,
    })
  }
})

router.get('/repair-orders', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { blockId, status, priority, assignedTo } = req.query

    let orders = store.getRepairOrders()

    if (status) orders = orders.filter((r) => r.status === status)
    if (priority) orders = orders.filter((r) => r.priority === priority)

    if (user.role === 'oil_worker') {
      orders = orders.filter((r) => r.assignedTo === user.id || r.reportedBy === user.id)
    } else if ((user.role === 'team_leader' || user.role === 'block_manager') && user.blockId) {
      orders = orders.filter((r) => r.blockId === user.blockId)
    } else if (user.role === 'hq_admin') {
      if (blockId) orders = orders.filter((r) => r.blockId === blockId)
      if (assignedTo) orders = orders.filter((r) => r.assignedTo === assignedTo)
    }

    res.json({
      success: true,
      data: orders,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取报修工单失败: ' + (err as Error).message,
    })
  }
})

router.post('/repair-orders', requirePermission('equipment', 'create'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const {
      title,
      description,
      equipmentId,
      wellId,
      blockId,
      assignedTo,
      priority,
      faultType,
      estimatedCost,
    } = req.body

    if (!title || !equipmentId || !blockId) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段: title, equipmentId, blockId',
      })
      return
    }

    const eq = store.findEquipmentById(equipmentId)
    if (!eq) {
      res.status(404).json({
        success: false,
        error: '设备不存在',
      })
      return
    }

    const validPriorities: RepairOrderPriority[] = ['low', 'medium', 'high', 'urgent']
    const validFaultTypes: RepairFaultType[] = ['mechanical', 'electrical', 'hydraulic', 'instrumentation', 'other']

    if (priority && !validPriorities.includes(priority)) {
      res.status(400).json({ success: false, error: '无效优先级' })
      return
    }
    if (faultType && !validFaultTypes.includes(faultType)) {
      res.status(400).json({ success: false, error: '无效故障类型' })
      return
    }

    const ro = store.createRepairOrder({
      title,
      description: description || '',
      equipmentId,
      wellId: wellId || eq.wellId,
      blockId,
      reportedBy: user.id,
      assignedTo,
      priority: priority || 'medium',
      faultType: faultType || 'mechanical',
      estimatedCost: Number(estimatedCost) || 0,
    })

    res.status(201).json({
      success: true,
      data: ro,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建报修工单失败: ' + (err as Error).message,
    })
  }
})

router.put('/repair-orders/:id/accept', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { id } = req.params

    const order = store.findRepairOrderById(id)
    if (!order) {
      res.status(404).json({
        success: false,
        error: '报修工单不存在',
      })
      return
    }

    const canAccept =
      order.assignedTo === user.id ||
      hasPermission(user.role, 'equipment', 'edit') ||
      (user.blockId && order.blockId === user.blockId && (user.role === 'team_leader' || user.role === 'block_manager'))

    if (!canAccept) {
      res.status(403).json({
        success: false,
        error: '无权接单',
      })
      return
    }

    if (order.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: '当前状态不可接单',
      })
      return
    }

    const updated = store.updateRepairOrder(id, {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      assignedTo: order.assignedTo || user.id,
    })

    res.json({
      success: true,
      data: updated,
      message: '已接单',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '接单失败: ' + (err as Error).message,
    })
  }
})

router.put('/repair-orders/:id/complete', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { id } = req.params
    const { photoUrls, notes, actualCost } = req.body

    const order = store.findRepairOrderById(id)
    if (!order) {
      res.status(404).json({
        success: false,
        error: '报修工单不存在',
      })
      return
    }

    const canComplete =
      order.assignedTo === user.id ||
      hasPermission(user.role, 'equipment', 'edit')

    if (!canComplete) {
      res.status(403).json({
        success: false,
        error: '无权完成此工单',
      })
      return
    }

    if (order.status !== 'accepted' && order.status !== 'in_progress') {
      res.status(400).json({
        success: false,
        error: '当前状态不可完成',
      })
      return
    }

    const patch: Partial<typeof order> = {
      status: 'completed',
      completedAt: new Date().toISOString(),
    }
    if (photoUrls && Array.isArray(photoUrls)) patch.photoUrls = photoUrls
    if (notes) patch.notes = notes
    if (actualCost) patch.estimatedCost = Number(actualCost)

    const updated = store.updateRepairOrder(id, patch)

    res.json({
      success: true,
      data: updated,
      message: '报修工单已完成',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '完成报修失败: ' + (err as Error).message,
    })
  }
})

export default router
