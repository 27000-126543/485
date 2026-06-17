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
    const blocks = blockId && typeof blockId === 'string'
      ? store.getBlocks().filter((b) => b.id === blockId)
      : store.getBlocks()

    const geologicalFeaturesPool = [
      '砂岩储层', '厚度大', '孔隙度好', '海相沉积', '裂缝发育', '高产井组',
      '深层油气', '高温高压', '技术挑战大', '陆相沉积', '砂体展布稳定', '邻井产量好',
      '构造圈闭', '渗透率高', '含油饱和度高', '剩余油富集',
    ]

    const proposals: Array<{
      id: string
      wellName: string
      blockName: string
      blockId: string
      predictedProduction: number
      predictedProductionRange: string
      riskLevel: 'low' | 'medium' | 'high'
      estimatedDepth: number
      estimatedCost: number
      coordinates: { x: number; y: number }
      geologicalFeatures: string[]
      confidence: number
      aiScore: number
      createdAt: string
      status?: string
      steps: Array<{
        id: string
        title: string
        assignee: string
        role: string
        status: 'pending' | 'approved' | 'rejected' | 'processing' | 'skipped'
        comment?: string
        createdAt?: string
        completedAt?: string
        deadline?: string
      }>
    }> = []

    blocks.forEach((block, blockIdx) => {
      const existingWells = store.getWells(block.id)
      const wellCount = 3
      const baseNum = existingWells.length + 1

      for (let i = 0; i < wellCount; i++) {
        const seed = blockIdx * 100 + i
        const rand = (offset: number) => {
          const x = Math.sin(seed * 9301 + offset * 49297) * 233280
          return x - Math.floor(x)
        }

        const confidence = Math.round(65 + rand(1) * 32)
        const aiScore = Math.round(68 + rand(2) * 30)
        const production = Math.round((25 + rand(3) * 65) * 10) / 10
        const prodMin = Math.max(10, Math.round(production * (0.7 + rand(4) * 0.1)))
        const prodMax = Math.round(production * (1.2 + rand(5) * 0.15))
        const depth = Math.round(2800 + rand(6) * 2800)
        const cost = Math.round((1800 + rand(7) * 3500))
        const riskIdx = rand(8) < 0.45 ? 0 : rand(8) < 0.8 ? 1 : 2
        const riskLevel = (['low', 'medium', 'high'] as const)[riskIdx]

        const featureCount = 2 + Math.floor(rand(9) * 3)
        const features: string[] = []
        for (let f = 0; f < featureCount; f++) {
          const idx = Math.floor(rand(10 + f) * geologicalFeaturesPool.length)
          if (!features.includes(geologicalFeaturesPool[idx])) {
            features.push(geologicalFeaturesPool[idx])
          }
        }

        const daysAgo = Math.floor(rand(11) * 5) + 1
        const createdAt = new Date(Date.now() - daysAgo * 86400000)

        const steps = [
          {
            id: 's1',
            title: 'AI推荐生成',
            assignee: 'AI系统',
            role: '系统自动',
            status: 'approved' as const,
            comment: aiScore >= 90
              ? '基于三维地质模型分析，地质条件优异，强烈推荐'
              : riskLevel === 'high'
                ? '高风险但高回报，建议专家论证'
                : '基于三维地质模型分析推荐',
            createdAt: createdAt.toISOString(),
            completedAt: createdAt.toISOString(),
          },
          {
            id: 's2',
            title: '地质师复核',
            assignee: riskIdx === 2 ? '刘专家' : i % 2 === 0 ? '张明远' : '陈地质',
            role: '地质工程师',
            status: (daysAgo <= 1 ? 'pending' : daysAgo <= 2 ? 'processing' : riskIdx === 2 ? 'rejected' : 'approved') as any,
            comment: riskIdx === 2 && daysAgo > 2
              ? '风险过高，建议暂缓，先进行二维勘探补充数据'
              : daysAgo > 2
                ? '地质数据可靠，建议进入审批流程'
                : undefined,
            createdAt: createdAt.toISOString(),
            completedAt: daysAgo > 2
              ? new Date(createdAt.getTime() + (daysAgo - 1) * 3600000 * 5).toISOString()
              : undefined,
            deadline: daysAgo <= 2
              ? new Date(createdAt.getTime() + 48 * 3600000).toISOString()
              : undefined,
          },
          {
            id: 's3',
            title: '总工程师审批',
            assignee: '李国栋',
            role: '总工程师',
            status: (daysAgo > 3 && riskIdx !== 2 ? 'approved' : riskIdx === 2 ? 'skipped' : 'pending') as any,
            createdAt: createdAt.toISOString(),
            deadline: daysAgo <= 3
              ? new Date(createdAt.getTime() + 48 * 3600000).toISOString()
              : undefined,
          },
          {
            id: 's4',
            title: '预算审核',
            assignee: '王财务',
            role: '物供经理',
            status: (daysAgo > 4 && riskIdx !== 2 ? 'approved' : riskIdx === 2 ? 'skipped' : 'pending') as any,
            createdAt: createdAt.toISOString(),
          },
        ]

        proposals.push({
          id: 'WP-' + block.code + '-' + String(baseNum + i).padStart(2, '0'),
          wellName: `${block.code}-新探${String(baseNum + i).padStart(2, '0')}井`,
          blockName: block.name,
          blockId: block.id,
          predictedProduction: production,
          predictedProductionRange: `${prodMin}-${prodMax}`,
          riskLevel,
          estimatedDepth: depth,
          estimatedCost: cost,
          coordinates: {
            x: Math.round(15 + rand(12) * 70),
            y: Math.round(15 + rand(13) * 70),
          },
          geologicalFeatures: features,
          confidence,
          aiScore,
          createdAt: createdAt.toISOString().replace('T', ' ').slice(0, 16),
          status,
          steps,
        })
      }
    })

    let result = proposals
    if (status && typeof status === 'string') {
      result = proposals.filter((p) => {
        const hasPending = p.steps.some((s) => s.status === 'pending' || s.status === 'processing')
        const allApproved = p.steps.every((s) => s.status === 'approved')
        const anyRejected = p.steps.some((s) => s.status === 'rejected')
        if (status === 'pending') return hasPending
        if (status === 'approved') return allApproved
        if (status === 'rejected') return anyRejected
        return true
      })
    }

    result.sort((a, b) => b.aiScore - a.aiScore)

    res.json({
      success: true,
      data: result,
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
