import type { AlertLevel } from '../types'

export function formatDate(
  date: string | Date | number | null | undefined,
  format: 'full' | 'date' | 'time' | 'datetime' = 'datetime'
): string {
  if (!date) return '--'

  const d = new Date(date)
  if (isNaN(d.getTime())) return '--'

  const pad = (n: number) => n.toString().padStart(2, '0')

  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  const seconds = pad(d.getSeconds())

  switch (format) {
    case 'full':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    case 'date':
      return `${year}-${month}-${day}`
    case 'time':
      return `${hours}:${minutes}:${seconds}`
    case 'datetime':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`
  }
}

export function formatRelativeTime(date: string | Date | number | null | undefined): string {
  if (!date) return '--'

  const d = new Date(date).getTime()
  if (isNaN(d)) return '--'

  const now = Date.now()
  const diff = now - d

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < week) return `${Math.floor(diff / day)}天前`
  if (diff < month) return `${Math.floor(diff / week)}周前`
  return formatDate(date, 'date')
}

export function formatNumber(
  num: number | null | undefined,
  decimals: number = 2
): string {
  if (num === null || num === undefined || isNaN(num)) return '--'
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatInteger(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '--'
  return Math.round(num).toLocaleString('zh-CN')
}

export function formatPercent(
  num: number | null | undefined,
  decimals: number = 1
): string {
  if (num === null || num === undefined || isNaN(num)) return '--'
  return `${formatNumber(num * 100, decimals)}%`
}

export function formatWithUnit(
  num: number | null | undefined,
  unit: string,
  decimals: number = 2
): string {
  if (num === null || num === undefined || isNaN(num)) return '--'
  return `${formatNumber(num, decimals)}${unit}`
}

type WellStatus = 'running' | 'stopped' | 'fault'
type WorkOrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'escalated'
type WorkOrderType = 'production' | 'equipment' | 'safety'
type ApprovalStatus = 'pending' | 'approved' | 'rejected'
type RiskLevel = 'low' | 'medium' | 'high'
type TransportStatus = 'pending' | 'dispatched' | 'in_transit' | 'arrived' | 'completed'
type EquipmentStatus = 'normal' | 'maintenance' | 'fault' | 'scrapped'
type TruckStatus = 'idle' | 'in_use' | 'maintenance'

const statusMap: Record<string, string> = {
  running: '运行中',
  stopped: '已停止',
  fault: '故障',

  pending: '待处理',
  confirmed: '已确认',
  processing: '处理中',
  completed: '已完成',
  escalated: '已升级',

  production: '生产',
  equipment: '设备',
  safety: '安全',

  approved: '已通过',
  rejected: '已驳回',

  low: '低',
  medium: '中',
  high: '高',

  normal: '正常',
  maintenance: '维护中',
  scrapped: '已报废',

  dispatched: '已派车',
  in_transit: '运输中',
  arrived: '已到达',

  idle: '空闲',
  in_use: '使用中',

  normal_alert: '正常',
  warning: '预警',
  danger: '危险',
  critical: '严重',
}

export function mapStatusToChinese(
  status:
    | WellStatus
    | WorkOrderStatus
    | WorkOrderType
    | ApprovalStatus
    | RiskLevel
    | TransportStatus
    | EquipmentStatus
    | TruckStatus
    | AlertLevel
    | string
    | null
    | undefined
): string {
  if (!status) return '--'
  return statusMap[status] || status
}

const levelColorMap: Record<AlertLevel, { bg: string; text: string; border: string; dot: string }> = {
  normal: {
    bg: 'bg-green-500/10',
    text: 'text-success',
    border: 'border-success/30',
    dot: 'bg-success',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-warning',
    border: 'border-warning/30',
    dot: 'bg-warning',
  },
  danger: {
    bg: 'bg-red-500/10',
    text: 'text-danger',
    border: 'border-danger/30',
    dot: 'bg-danger',
  },
  critical: {
    bg: 'bg-red-600/20',
    text: 'text-red-500',
    border: 'border-red-500/50',
    dot: 'bg-red-600',
  },
}

export function getLevelColor(level: AlertLevel | null | undefined) {
  if (!level) return levelColorMap.normal
  return levelColorMap[level] || levelColorMap.normal
}

const statusColorMap: Record<string, { bg: string; text: string }> = {
  running: { bg: 'bg-success/10', text: 'text-success' },
  stopped: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
  fault: { bg: 'bg-danger/10', text: 'text-danger' },

  pending: { bg: 'bg-warning/10', text: 'text-warning' },
  confirmed: { bg: 'bg-cyber-blue/10', text: 'text-cyber-blue' },
  processing: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  completed: { bg: 'bg-success/10', text: 'text-success' },
  escalated: { bg: 'bg-danger/10', text: 'text-danger' },

  approved: { bg: 'bg-success/10', text: 'text-success' },
  rejected: { bg: 'bg-danger/10', text: 'text-danger' },

  low: { bg: 'bg-success/10', text: 'text-success' },
  medium: { bg: 'bg-warning/10', text: 'text-warning' },
  high: { bg: 'bg-danger/10', text: 'text-danger' },

  normal: { bg: 'bg-success/10', text: 'text-success' },
  maintenance: { bg: 'bg-warning/10', text: 'text-warning' },
  scrapped: { bg: 'bg-gray-500/10', text: 'text-gray-400' },

  dispatched: { bg: 'bg-cyber-blue/10', text: 'text-cyber-blue' },
  in_transit: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  arrived: { bg: 'bg-success/10', text: 'text-success' },

  idle: { bg: 'bg-success/10', text: 'text-success' },
  in_use: { bg: 'bg-cyber-blue/10', text: 'text-cyber-blue' },
}

export function getStatusColor(status: string | null | undefined) {
  if (!status) return statusColorMap.normal
  return statusColorMap[status] || { bg: 'bg-gray-500/10', text: 'text-gray-400' }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${formatNumber(bytes / 1024, 1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${formatNumber(bytes / (1024 * 1024), 1)} MB`
  return `${formatNumber(bytes / (1024 * 1024 * 1024), 2)} GB`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) return '--'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`
  }
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}
