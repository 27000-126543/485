import { Router, type Response } from 'express'
import { store } from '../data/store.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { requirePermission, hasPermission } from '../middleware/rbac.js'
import type { PurchaseRequestStatus } from '../../shared/types.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('drilling', 'view'))

router.get('/rigs', (req: AuthRequest, res: Response): void => {
  try {
    const { status, blockId } = req.query
    let rigs = store.getDrillingRigs()

    if (status) {
      rigs = rigs.filter((r) => r.status === status)
    }
    if (blockId) {
      rigs = rigs.filter((r) => r.blockId === blockId)
    }

    res.json({
      success: true,
      data: rigs,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取钻机列表失败: ' + (err as Error).message,
    })
  }
})

router.get('/schedule', (req: AuthRequest, res: Response): void => {
  try {
    const proposals = store.getDrillingProposals()
    const rigs = store.getDrillingRigs()
    const today = new Date()

    const tasks: Array<{
      id: string
      code: string
      title: string
      rigId?: string
      rigName?: string
      blockId: string
      blockName: string
      status: string
      startDate: string
      endDate: string
      progress: number
      assignee?: string
    }> = []

    proposals.forEach((p, idx) => {
      if (p.status === 'draft' || p.status === 'rejected') return
      const block = store.findBlockById(p.blockId)
      const rig = rigs.find((r) => r.proposalId === p.id) || rigs[idx % rigs.length]
      const start = p.startDate ? new Date(p.startDate) : new Date(today.getTime() + idx * 86400000)
      const duration = p.estimatedDuration || 30
      const end = new Date(start.getTime() + duration * 86400000)

      let progress = 0
      if (p.status === 'in_progress') {
        const elapsed = (today.getTime() - start.getTime()) / 86400000
        progress = Math.min(100, Math.round((elapsed / duration) * 100))
      } else if (p.status === 'completed') {
        progress = 100
      } else if (p.status === 'approved') {
        progress = 5
      }

      tasks.push({
        id: p.id,
        code: p.code,
        title: p.title,
        rigId: rig?.id,
        rigName: rig?.name,
        blockId: p.blockId,
        blockName: block?.name || p.blockId,
        status: p.status,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        progress,
        assignee: p.proposedBy,
      })
    })

    res.json({
      success: true,
      data: {
        tasks,
        rigs,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取排程数据失败: ' + (err as Error).message,
    })
  }
})

router.get('/materials', (req: AuthRequest, res: Response): void => {
  try {
    const { category, lowStock } = req.query
    let stocks = store.getMaterialStocks()

    if (category) {
      stocks = stocks.filter((s) => s.category === category)
    }
    if (lowStock === 'true' || lowStock === '1') {
      stocks = stocks.filter((s) => s.currentStock <= s.minStock)
    }

    res.json({
      success: true,
      data: stocks.map((s) => ({
        ...s,
        isLowStock: s.currentStock <= s.minStock,
        stockRate: Math.round((s.currentStock / s.maxStock) * 100),
      })),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取物料库存失败: ' + (err as Error).message,
    })
  }
})

router.get('/purchase-requests', (req: AuthRequest, res: Response): void => {
  try {
    const { status, department } = req.query
    let list = store.getPurchaseRequests()

    if (status) {
      list = list.filter((p) => p.status === status)
    }
    if (department) {
      list = list.filter((p) => p.department === department)
    }

    res.json({
      success: true,
      data: list,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取采购申请失败: ' + (err as Error).message,
    })
  }
})

router.post('/purchase-requests', requirePermission('drilling', 'create'), (req: AuthRequest, res: Response): void => {
  try {
    const { title, department, totalAmount, items, urgency, expectedDeliveryDate, notes } = req.body

    if (!title || !department || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段: title, department, items',
      })
      return
    }

    const calcTotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0)

    const pr = store.createPurchaseRequest({
      title,
      requestedBy: req.user!.id,
      department,
      totalAmount: totalAmount || calcTotal,
      items: items.map((it) => ({
        materialId: it.materialId || '',
        materialName: it.materialName || '',
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
      })),
      urgency: urgency || 'medium',
      expectedDeliveryDate: expectedDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      notes,
    })

    res.status(201).json({
      success: true,
      data: pr,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建采购申请失败: ' + (err as Error).message,
    })
  }
})

router.put('/purchase-requests/:id/approve', requirePermission('drilling', 'approve'), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const { status, comment } = req.body

    const pr = store.findPurchaseRequestById(id)
    if (!pr) {
      res.status(404).json({
        success: false,
        error: '采购申请不存在',
      })
      return
    }

    if (!hasPermission(req.user!.role, 'drilling', 'approve')) {
      res.status(403).json({
        success: false,
        error: '无审批权限',
      })
      return
    }

    const validStatuses: PurchaseRequestStatus[] = ['submitted', 'approved', 'rejected', 'ordered', 'received']
    const newStatus: PurchaseRequestStatus = status && validStatuses.includes(status) ? status : 'approved'

    const updated = store.updatePurchaseRequest(id, {
      status: newStatus,
      approvedBy: newStatus === 'approved' ? req.user!.id : pr.approvedBy,
      notes: comment ? (pr.notes ? pr.notes + '\n' + comment : comment) : pr.notes,
    })

    res.json({
      success: true,
      data: updated,
      message: '审批成功',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '审批失败: ' + (err as Error).message,
    })
  }
})

export default router
