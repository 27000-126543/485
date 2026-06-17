import { Router, type Response } from 'express'
import { store } from '../data/store.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { requireModuleAccess } from '../middleware/rbac.js'

const router = Router()

router.use(authenticate)
router.use(requireModuleAccess('dashboard'))

router.get('/stats', (req: AuthRequest, res: Response): void => {
  try {
    const { blockId } = req.query
    const allBlocks = store.getBlocks()
    const allWells = blockId && typeof blockId === 'string'
      ? store.getWells(blockId)
      : store.getData().wells
    const allTanks = store.getData().tanks
    const allEquipment = store.getData().equipment
    const allAlerts = store.getData().safetyAlerts.filter(a => !a.resolved)

    const dailyProduction = allWells.reduce((sum, w) => sum + w.dailyProduction, 0)
    const integrityRateAvg = allWells.length > 0
      ? allWells.reduce((sum, w) => sum + w.integrityRate, 0) / allWells.length
      : 0
    const avgTankLevel = allTanks.length > 0
      ? allTanks.reduce((sum, t) => sum + (t.currentLevel / t.capacity * 100), 0) / allTanks.length
      : 0
    const runningEquipment = allEquipment.filter(e => e.status === 'operational').length

    const blockProductions = allBlocks
      .filter(b => !blockId || b.id === blockId)
      .map(b => {
        const bWells = store.getWells(b.id)
        const bDaily = bWells.reduce((s, w) => s + w.dailyProduction, 0)
        return {
          blockId: b.id,
          blockName: b.name,
          daily: Math.round(bDaily),
          monthly: Math.round(bDaily * 30),
          yearly: Math.round(bDaily * 365),
        }
      })

    const blockIntegrities = allBlocks
      .filter(b => !blockId || b.id === blockId)
      .map(b => {
        const bWells = store.getWells(b.id)
        const rate = bWells.length > 0
          ? bWells.reduce((s, w) => s + w.integrityRate, 0) / bWells.length
          : 0
        return {
          blockId: b.id,
          blockName: b.name,
          rate: Math.round(rate * 10) / 10,
        }
      })

    const tankLevels = allTanks
      .filter(t => !blockId || t.blockId === blockId)
      .map(t => ({
        id: t.id,
        name: t.name,
        level: Math.round(t.currentLevel / t.capacity * 100),
        capacity: t.capacity,
        lowThreshold: 15,
        highThreshold: 85,
      }))

    const wells = allWells
      .slice(0, 10)
      .map(w => {
        const sensorData = store.getSensorDataByWellId(w.id, 1)
        const latest = sensorData.length > 0 ? sensorData[0] : null
        return {
          id: w.id,
          name: w.name,
          oilPressure: latest?.pressure ? Math.round(latest.pressure * 10) / 10 : w.pressure,
          temperature: latest?.temperature ? Math.round(latest.temperature * 10) / 10 : w.temperature,
        }
      })

    const alerts = allAlerts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        level: a.level as any,
        title: a.title,
        description: a.description,
        source: '安全监测系统',
        time: a.createdAt,
      }))

    const data = {
      dailyProduction: Math.round(dailyProduction * 10) / 10,
      dailyProductionChange: +(Math.random() * 5 - 2).toFixed(1),
      integrityRateAvg: Math.round(integrityRateAvg * 10) / 10,
      integrityRateChange: +(Math.random() * 2 - 0.5).toFixed(1),
      avgTankLevel: Math.round(avgTankLevel * 10) / 10,
      avgTankLevelChange: +(Math.random() * 3 - 1.5).toFixed(1),
      runningEquipment,
      runningEquipmentChange: Math.floor(Math.random() * 6 - 2),
      blockProductions,
      blockIntegrities,
      tankLevels,
      wells,
      alerts,
    }

    res.json({
      success: true,
      data,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取统计数据失败: ' + (err as Error).message,
    })
  }
})

router.post('/export-report', (req: AuthRequest, res: Response): void => {
  try {
    const { month, blockId, format } = req.body

    if (!month) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段: month',
      })
      return
    }

    const targetDate = new Date(month)
    const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`

    let blocks = store.getBlocks()
    if (blockId) {
      blocks = blocks.filter((b) => b.id === blockId)
    }
    const allTanks = store.getData().tanks

    const headers = ['区块', '油井数', '日产油量(吨)', '月产油量(吨)', '井口完好率(%)', '平均储罐液位(%)', '紧急告警数', '危险告警数', '警告数', '提示数', '活跃工单']
    const rows: string[][] = []

    let totalWells = 0
    let totalDailyProduction = 0
    let totalIntegritySum = 0
    let totalIntegrityCount = 0
    let totalTankLevelSum = 0
    let totalTankLevelCount = 0
    let totalCriticalAlerts = 0
    let totalDangerAlerts = 0
    let totalWarningAlerts = 0
    let totalInfoAlerts = 0
    let totalActiveWorkOrders = 0

    blocks.forEach((block) => {
      const wells = store.getWells(block.id)
      const daily = wells.reduce((sum, w) => sum + w.dailyProduction, 0)
      const monthly = daily * 30
      const integritySum = wells.reduce((sum, w) => sum + w.integrityRate, 0)
      const integrityAvg = wells.length > 0 ? integritySum / wells.length : 0

      const blockTanks = allTanks.filter((t) => t.blockId === block.id)
      const tankLevelSum = blockTanks.reduce((sum, t) => sum + (t.currentLevel / t.capacity * 100), 0)
      const tankLevelAvg = blockTanks.length > 0 ? tankLevelSum / blockTanks.length : 0

      const allAlerts = store.getSafetyAlerts(block.id)
      const activeAlerts = allAlerts.filter((a) => !a.resolved)
      const criticalCount = activeAlerts.filter((a) => a.level === 'critical').length
      const dangerCount = activeAlerts.filter((a) => a.level === 'danger').length
      const warningCount = activeAlerts.filter((a) => a.level === 'warning').length
      const infoCount = activeAlerts.filter((a) => a.level === 'info').length

      const workOrders = store.getWorkOrders(undefined, block.id).filter(
        (o) => o.status === 'in_progress' || o.status === 'pending'
      ).length

      totalWells += wells.length
      totalDailyProduction += daily
      totalIntegritySum += integritySum
      totalIntegrityCount += wells.length
      totalTankLevelSum += tankLevelSum
      totalTankLevelCount += blockTanks.length
      totalCriticalAlerts += criticalCount
      totalDangerAlerts += dangerCount
      totalWarningAlerts += warningCount
      totalInfoAlerts += infoCount
      totalActiveWorkOrders += workOrders

      rows.push([
        block.name,
        String(wells.length),
        daily.toFixed(2),
        monthly.toFixed(2),
        integrityAvg.toFixed(1),
        tankLevelAvg.toFixed(1),
        String(criticalCount),
        String(dangerCount),
        String(warningCount),
        String(infoCount),
        String(workOrders),
      ])
    })

    const avgIntegrityAll = totalIntegrityCount > 0 ? totalIntegritySum / totalIntegrityCount : 0
    const avgTankLevelAll = totalTankLevelCount > 0 ? totalTankLevelSum / totalTankLevelCount : 0

    rows.push([
      '合计/平均',
      String(totalWells),
      totalDailyProduction.toFixed(2),
      (totalDailyProduction * 30).toFixed(2),
      avgIntegrityAll.toFixed(1),
      avgTankLevelAll.toFixed(1),
      String(totalCriticalAlerts),
      String(totalDangerAlerts),
      String(totalWarningAlerts),
      String(totalInfoAlerts),
      String(totalActiveWorkOrders),
    ])

    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const bom = '\uFEFF'
    const fullContent = bom + csvContent

    if (format === 'json') {
      res.json({
        success: true,
        data: {
          month: monthStr,
          headers,
          rows,
          summary: {
            totalWells,
            dailyProduction: +totalDailyProduction.toFixed(2),
            monthlyProduction: +(totalDailyProduction * 30).toFixed(2),
            avgIntegrityRate: +avgIntegrityAll.toFixed(1),
            avgTankLevel: +avgTankLevelAll.toFixed(1),
            alertCounts: {
              critical: totalCriticalAlerts,
              danger: totalDangerAlerts,
              warning: totalWarningAlerts,
              info: totalInfoAlerts,
            },
            activeWorkOrders: totalActiveWorkOrders,
          },
          blockProductions: blocks.map((b) => ({
            blockId: b.id,
            blockName: b.name,
            daily: Math.round(store.getWells(b.id).reduce((s, w) => s + w.dailyProduction, 0)),
            monthly: Math.round(store.getWells(b.id).reduce((s, w) => s + w.dailyProduction, 0) * 30),
          })),
          blockIntegrities: blocks.map((b) => {
            const bWells = store.getWells(b.id)
            const rate = bWells.length > 0 ? bWells.reduce((s, w) => s + w.integrityRate, 0) / bWells.length : 0
            return { blockId: b.id, blockName: b.name, rate: Math.round(rate * 10) / 10 }
          }),
          tankLevels: allTanks
            .filter((t) => !blockId || t.blockId === blockId)
            .map((t) => ({
              id: t.id,
              name: t.name,
              level: Math.round(t.currentLevel / t.capacity * 100),
              capacity: t.capacity,
            })),
        },
      })
      return
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="production-report-${monthStr}.csv"`)
    res.send(fullContent)
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '导出报表失败: ' + (err as Error).message,
    })
  }
})

export default router
