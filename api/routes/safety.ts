import { Router, type Response } from 'express'
import { store } from '../data/store.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { requirePermission, hasPermission } from '../middleware/rbac.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('safety', 'view'))

router.get('/sensors', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { blockId, type, status, wellId } = req.query

    let sensors = store.getSafetySensors()

    if (type) sensors = sensors.filter((s) => s.type === type)
    if (status) sensors = sensors.filter((s) => s.status === status)
    if (wellId) sensors = sensors.filter((s) => s.wellId === wellId)

    if ((user.role === 'block_manager' || user.role === 'team_leader' || user.role === 'oil_worker') && user.blockId) {
      sensors = sensors.filter((s) => s.blockId === user.blockId)
    } else if (blockId && user.role === 'hq_admin') {
      sensors = sensors.filter((s) => s.blockId === blockId)
    }

    res.json({
      success: true,
      data: sensors.map((s) => ({
        ...s,
        isAbnormal: s.currentValue < s.thresholdMin || s.currentValue > s.thresholdMax,
      })),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取安全传感器失败: ' + (err as Error).message,
    })
  }
})

router.get('/alerts', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { blockId, level, resolved, acknowledged, wellId } = req.query

    let alerts = store.getSafetyAlerts()

    if (level) alerts = alerts.filter((a) => a.level === level)
    if (wellId) alerts = alerts.filter((a) => a.wellId === wellId)

    if (resolved === 'true' || resolved === '1') {
      alerts = alerts.filter((a) => a.resolved)
    } else if (resolved === 'false' || resolved === '0') {
      alerts = alerts.filter((a) => !a.resolved)
    }

    if (acknowledged === 'true' || acknowledged === '1') {
      alerts = alerts.filter((a) => a.acknowledged)
    } else if (acknowledged === 'false' || acknowledged === '0') {
      alerts = alerts.filter((a) => !a.acknowledged)
    }

    if ((user.role === 'block_manager' || user.role === 'team_leader') && user.blockId) {
      alerts = alerts.filter((a) => a.blockId === user.blockId)
    } else if (user.role === 'oil_worker' && user.blockId) {
      alerts = alerts.filter((a) => a.blockId === user.blockId)
    } else if (blockId && user.role === 'hq_admin') {
      alerts = alerts.filter((a) => a.blockId === blockId)
    }

    alerts.sort((a, b) => {
      const levelOrder = { critical: 0, danger: 1, warning: 2, info: 3 }
      const la = levelOrder[a.level] ?? 4
      const lb = levelOrder[b.level] ?? 4
      if (la !== lb) return la - lb
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    res.json({
      success: true,
      data: alerts,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取告警列表失败: ' + (err as Error).message,
    })
  }
})

router.post('/alerts/:id/acknowledge', requirePermission('safety', 'edit'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { id } = req.params

    const alert = store.findSafetyAlertById(id)
    if (!alert) {
      res.status(404).json({
        success: false,
        error: '告警不存在',
      })
      return
    }

    if (user.blockId && alert.blockId !== user.blockId && !hasPermission(user.role, 'safety', 'edit')) {
      res.status(403).json({
        success: false,
        error: '无权确认此告警',
      })
      return
    }

    if (alert.acknowledged) {
      res.status(400).json({
        success: false,
        error: '告警已被确认',
      })
      return
    }

    const updated = store.updateSafetyAlert(id, {
      acknowledged: true,
      acknowledgedBy: user.id,
      acknowledgedAt: new Date().toISOString(),
    })

    res.json({
      success: true,
      data: updated,
      message: '告警已确认',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '确认告警失败: ' + (err as Error).message,
    })
  }
})

router.post('/valve/:id/shutdown', requirePermission('safety', 'approve'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { id } = req.params
    const { reason } = req.body

    const sensor = store.findSafetySensorById(id)
    if (!sensor) {
      const equipment = store.findEquipmentById(id)
      if (!equipment || equipment.category !== 'valve') {
        res.status(404).json({
          success: false,
          error: '阀门不存在',
        })
        return
      }
    }

    const valveEquipment = sensor
      ? store.getEquipment().find((e) => e.category === 'valve' && (e.wellId === sensor.wellId || e.blockId === sensor.blockId))
      : store.findEquipmentById(id)

    if (valveEquipment) {
      valveEquipment.status = 'maintenance'
    }

    if (sensor) {
      store.updateSafetySensor(id, {
        status: 'maintenance',
        lastReadingTime: new Date().toISOString(),
      })
    }

    const relatedAlert = store.getSafetyAlerts().find(
      (a) => (a.sensorId === id || a.wellId === valveEquipment?.wellId) && !a.resolved
    )
    if (relatedAlert) {
      store.updateSafetyAlert(relatedAlert.id, {
        acknowledged: true,
        acknowledgedBy: user.id,
        acknowledgedAt: new Date().toISOString(),
        resolved: true,
        resolvedBy: user.id,
        resolvedAt: new Date().toISOString(),
        resolution: `紧急关断阀门操作${reason ? ': ' + reason : ''}`,
      })
    }

    res.json({
      success: true,
      message: '阀门关断操作成功',
      data: {
        valveId: id,
        shutdownAt: new Date().toISOString(),
        operatorId: user.id,
        operatorName: user.name,
        reason: reason || '安全紧急关断',
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '关断阀门失败: ' + (err as Error).message,
    })
  }
})

router.get('/emergency-plan/:alertId', (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!
    const { alertId } = req.params

    const alert = store.findSafetyAlertById(alertId)
    if (!alert) {
      res.status(404).json({
        success: false,
        error: '告警不存在',
      })
      return
    }

    if (user.blockId && alert.blockId !== user.blockId && user.role !== 'hq_admin') {
      res.status(403).json({
        success: false,
        error: '无权访问此应急预案',
      })
      return
    }

    const block = store.findBlockById(alert.blockId)
    const well = alert.wellId ? store.findWellById(alert.wellId) : undefined
    const sensor = alert.sensorId ? store.findSafetySensorById(alert.sensorId) : undefined

    const levelPlans: Record<string, { level: string; evacuation: boolean; steps: string[] }> = {
      info: {
        level: '低风险',
        evacuation: false,
        steps: ['通知现场人员检查情况', '记录异常数据', '持续监控传感器数据', '如未恢复则上报班组长'],
      },
      warning: {
        level: '一般风险',
        evacuation: false,
        steps: ['立即通知当班班组长', '派出现场人员排查', '准备应急物资', '每15分钟汇报一次进展', '必要时降低产量运行'],
      },
      danger: {
        level: '较高风险',
        evacuation: true,
        steps: [
          '立即启动应急预案',
          '通知危险区域人员撤离',
          '关闭相关设备和阀门',
          '通知区块主管和安全部门',
          '设置警戒区域',
          '联系消防和医疗支援',
          '每5分钟更新一次情况',
        ],
      },
      critical: {
        level: '严重风险',
        evacuation: true,
        steps: [
          '立即启动最高级别应急预案',
          '全员紧急撤离至安全集合点',
          '紧急关闭所有相关阀门和设备',
          '同时通知公司管理层、消防、医疗、安监部门',
          '现场总指挥协调救援',
          '清点撤离人数',
          '启动周边区域警戒',
          '持续监测环境变化',
        ],
      },
    }

    const plan = levelPlans[alert.level] || levelPlans.warning
    const contacts = store.getUsers().filter((u) => {
      if (u.role === 'hq_admin' || u.role === 'chief_engineer') return true
      if (alert.blockId && u.blockId === alert.blockId) {
        return u.role === 'block_manager' || u.role === 'team_leader'
      }
      return false
    })

    res.json({
      success: true,
      data: {
        alertId: alert.id,
        alertTitle: alert.title,
        alertLevel: alert.level,
        riskLevel: plan.level,
        blockName: block?.name || alert.blockId,
        wellName: well?.name,
        sensorName: sensor?.name,
        location: sensor?.location || block?.location,
        requireEvacuation: plan.evacuation,
        responseSteps: plan.steps,
        emergencyContacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          phone: c.phone,
          email: c.email,
        })),
        nearestFacilities: {
          hospital: '油田中心医院 (距离 5km)',
          fireStation: '油田消防站 (距离 3km)',
          shelter: `${block?.name || '区块'}应急集合点`,
        },
        createdAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取应急预案失败: ' + (err as Error).message,
    })
  }
})

export default router
