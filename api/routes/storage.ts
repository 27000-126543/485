import { Router, type Response } from 'express'
import { store } from '../data/store.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { requirePermission, hasPermission } from '../middleware/rbac.js'
import type { TankType, TransportOrderStatus } from '../../shared/types.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('storage', 'view'))

router.get('/tanks', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { blockId, type, status } = req.query

    let tanks = store.getTanks()

    if (type) tanks = tanks.filter((t) => t.type === type)
    if (status) tanks = tanks.filter((t) => t.status === status)

    if ((user.role === 'block_manager' || user.role === 'team_leader') && user.blockId) {
      tanks = tanks.filter((t) => t.blockId === user.blockId)
    } else if (blockId && user.role === 'hq_admin') {
      tanks = tanks.filter((t) => t.blockId === blockId)
    }

    res.json({
      success: true,
      data: tanks.map((t) => ({
        ...t,
        fillRate: Math.round((t.currentLevel / t.capacity) * 100),
      })),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取储罐列表失败: ' + (err as Error).message,
    })
  }
})

router.get('/trucks', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { blockId, status } = req.query

    let trucks = store.getTrucks()

    if (status) trucks = trucks.filter((t) => t.status === status)

    if ((user.role === 'block_manager' || user.role === 'team_leader') && user.blockId) {
      trucks = trucks.filter((t) => t.blockId === user.blockId)
    } else if (blockId && user.role === 'hq_admin') {
      trucks = trucks.filter((t) => t.blockId === blockId)
    }

    res.json({
      success: true,
      data: trucks,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取罐车列表失败: ' + (err as Error).message,
    })
  }
})

router.get('/transport-orders', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { status, sourceBlockId, truckId } = req.query

    let orders = store.getTransportOrders()

    if (status) orders = orders.filter((o) => o.status === status)
    if (truckId) orders = orders.filter((o) => o.truckId === truckId)

    if ((user.role === 'block_manager' || user.role === 'team_leader') && user.blockId) {
      orders = orders.filter((o) => o.sourceBlockId === user.blockId)
    } else if (sourceBlockId && user.role === 'hq_admin') {
      orders = orders.filter((o) => o.sourceBlockId === sourceBlockId)
    }

    res.json({
      success: true,
      data: orders,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取运输订单失败: ' + (err as Error).message,
    })
  }
})

router.post('/transport-orders', requirePermission('storage', 'create'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const {
      truckId,
      tankId,
      sourceBlockId,
      destination,
      materialType,
      quantity,
      driverId,
      estimatedDuration,
      notes,
    } = req.body

    if (!truckId || !sourceBlockId || !destination || !materialType || !quantity || !driverId) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段: truckId, sourceBlockId, destination, materialType, quantity, driverId',
      })
      return
    }

    const validTypes: TankType[] = ['crude_oil', 'diesel', 'gasoline', 'chemical', 'water']
    if (!validTypes.includes(materialType)) {
      res.status(400).json({
        success: false,
        error: '无效的物料类型',
      })
      return
    }

    const truck = store.getTrucks().find((t) => t.id === truckId)
    if (!truck) {
      res.status(404).json({
        success: false,
        error: '罐车不存在',
      })
      return
    }

    if (Number(quantity) > truck.capacity) {
      res.status(400).json({
        success: false,
        error: '运输量超出罐车容量',
      })
      return
    }

    const order = store.createTransportOrder({
      truckId,
      tankId,
      sourceBlockId,
      destination,
      materialType,
      quantity: Number(quantity),
      driverId,
      dispatcherId: user.id,
      estimatedDuration: Number(estimatedDuration) || 4,
      notes,
    })

    res.status(201).json({
      success: true,
      data: order,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建运输订单失败: ' + (err as Error).message,
    })
  }
})

router.put('/transport-orders/:id/reassign', requirePermission('storage', 'edit'), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const { truckId, driverId, notes } = req.body

    const order = store.findTransportOrderById(id)
    if (!order) {
      res.status(404).json({
        success: false,
        error: '运输订单不存在',
      })
      return
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: '当前订单状态不可转派',
      })
      return
    }

    const patch: Partial<typeof order> = {}
    if (truckId) {
      const truck = store.getTrucks().find((t) => t.id === truckId)
      if (!truck) {
        res.status(404).json({ success: false, error: '新罐车不存在' })
        return
      }
      if (order.quantity > truck.capacity) {
        res.status(400).json({ success: false, error: '运输量超出新罐车容量' })
        return
      }
      patch.truckId = truckId
    }
    if (driverId) {
      patch.driverId = driverId
    }
    if (notes) {
      patch.notes = order.notes ? order.notes + '\n转派备注: ' + notes : '转派备注: ' + notes
    }

    if (!truckId && !driverId) {
      res.status(400).json({
        success: false,
        error: '请提供 truckId 或 driverId',
      })
      return
    }

    if (!hasPermission(req.user!.role, 'storage', 'approve')) {
      if (order.status === 'in_transit') {
        res.status(403).json({
          success: false,
          error: '运输中订单需审批权限才能转派',
        })
        return
      }
    }

    const updated = store.updateTransportOrder(id, patch)

    res.json({
      success: true,
      data: updated,
      message: '转派成功',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '转派失败: ' + (err as Error).message,
    })
  }
})

export default router
