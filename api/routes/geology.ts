import { Router, type Response } from 'express'
import { store } from '../data/store.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { requirePermission, hasPermission } from '../middleware/rbac.js'
import type { DrillingProposalStatus } from '../../shared/types.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('geology', 'view'))

router.get('/proposals', (req: AuthRequest, res: Response): void => {
  try {
    const { blockId, status } = req.query
    let proposals = store.getDrillingProposals(blockId as string | undefined)

    if (status) {
      proposals = proposals.filter((p) => p.status === status)
    }

    res.json({
      success: true,
      data: proposals,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取钻井方案失败: ' + (err as Error).message,
    })
  }
})

router.get('/proposals/:id', (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const proposal = store.findDrillingProposalById(id)

    if (!proposal) {
      res.status(404).json({
        success: false,
        error: '钻井方案不存在',
      })
      return
    }

    res.json({
      success: true,
      data: proposal,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取钻井方案详情失败: ' + (err as Error).message,
    })
  }
})

router.post('/proposals', requirePermission('geology', 'create'), (req: AuthRequest, res: Response): void => {
  try {
    const {
      title,
      blockId,
      targetDepth,
      estimatedCost,
      estimatedDuration,
      geologicalAssessment,
      equipmentRequirements,
      materialRequirements,
      startDate,
      notes,
    } = req.body

    if (!title || !blockId || !targetDepth) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段: title, blockId, targetDepth',
      })
      return
    }

    const block = store.findBlockById(blockId)
    if (!block) {
      res.status(404).json({
        success: false,
        error: '区块不存在',
      })
      return
    }

    const proposal = store.createDrillingProposal({
      title,
      blockId,
      proposedBy: req.user!.id,
      targetDepth: Number(targetDepth),
      estimatedCost: Number(estimatedCost) || 0,
      estimatedDuration: Number(estimatedDuration) || 0,
      geologicalAssessment: geologicalAssessment || '',
      equipmentRequirements: equipmentRequirements || [],
      materialRequirements: materialRequirements || [],
      startDate,
      notes,
    })

    res.status(201).json({
      success: true,
      data: proposal,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建钻井方案失败: ' + (err as Error).message,
    })
  }
})

router.put('/proposals/:id/approve', requirePermission('geology', 'approve'), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const { role, comment, status } = req.body

    const proposal = store.findDrillingProposalById(id)
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: '钻井方案不存在',
      })
      return
    }

    if (!hasPermission(req.user!.role, 'geology', 'approve')) {
      res.status(403).json({
        success: false,
        error: '无审批权限',
      })
      return
    }

    const validStatuses: DrillingProposalStatus[] = ['reviewing', 'approved', 'rejected', 'in_progress', 'completed']
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: '无效的状态值',
      })
      return
    }

    const newStatus: DrillingProposalStatus = status || 'approved'
    const updated = store.updateDrillingProposal(id, {
      status: newStatus,
      reviewedBy: proposal.reviewedBy || req.user!.id,
      approvedBy: newStatus === 'approved' || newStatus === 'in_progress' ? req.user!.id : proposal.approvedBy,
      notes: comment ? (proposal.notes ? proposal.notes + '\n' + comment : comment) : proposal.notes,
    })

    res.json({
      success: true,
      data: updated,
      message: '审批操作成功',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '审批失败: ' + (err as Error).message,
    })
  }
})

router.get('/well-recommendations', (req: AuthRequest, res: Response): void => {
  try {
    const { blockId } = req.query
    const blocks = blockId
      ? store.getBlocks().filter((b) => b.id === blockId)
      : store.getBlocks()

    const recommendations: Array<{
      id: string
      blockId: string
      blockName: string
      name: string
      location: { lat: number; lng: number }
      estimatedDepth: number
      estimatedProduction: number
      confidence: number
      geologicalFeatures: string[]
      riskLevel: 'low' | 'medium' | 'high'
    }> = []

    blocks.forEach((block) => {
      const existingWells = store.getWells(block.id)
      const count = Math.min(3, 5 - existingWells.length)
      for (let i = 0; i < count; i++) {
        recommendations.push({
          id: 'rec-' + block.id + '-' + i,
          blockId: block.id,
          blockName: block.name,
          name: `${block.code}-推荐井-${String(existingWells.length + i + 1).padStart(2, '0')}`,
          location: {
            lat: 30 + Math.random() * 5 + block.area * 0.001,
            lng: 110 + Math.random() * 5 + block.area * 0.001,
          },
          estimatedDepth: Math.round(2500 + Math.random() * 2500),
          estimatedProduction: Math.round((20 + Math.random() * 60) * 100) / 100,
          confidence: Math.round((0.6 + Math.random() * 0.35) * 100) / 100,
          geologicalFeatures: ['砂岩储层', '孔隙度高', '渗透率好', '构造圈闭'].slice(
            0,
            Math.floor(Math.random() * 3) + 1
          ),
          riskLevel: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
        })
      }
    })

    res.json({
      success: true,
      data: recommendations.sort((a, b) => b.confidence - a.confidence),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取AI推荐井位失败: ' + (err as Error).message,
    })
  }
})

export default router
