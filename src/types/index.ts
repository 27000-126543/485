export type UserRole =
  | 'oil_worker'
  | 'team_leader'
  | 'block_manager'
  | 'hq_admin'
  | 'geologist'
  | 'chief_engineer'
  | 'supply_manager'
  | 'drilling_engineer'
  | 'storage_manager'
  | 'maintenance_engineer'
  | 'safety_officer'

export type ModuleName =
  | 'dashboard'
  | 'geology'
  | 'drilling'
  | 'production'
  | 'storage'
  | 'equipment'
  | 'safety'
  | 'system'

export type AlertLevel = 'normal' | 'warning' | 'danger' | 'critical'
export type SafetyAlertLevel = 'info' | 'warning' | 'error' | 'critical'

export type WellStatus = 'running' | 'stopped' | 'fault'
export type WorkOrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'escalated'
export type WorkOrderType = 'production' | 'equipment' | 'safety'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type RiskLevel = 'low' | 'medium' | 'high'
export type TransportStatus = 'pending' | 'dispatched' | 'in_transit' | 'arrived' | 'completed'
export type EquipmentStatus = 'normal' | 'maintenance' | 'fault' | 'scrapped'
export type TruckStatus = 'idle' | 'in_use' | 'maintenance'

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  blockId?: string
  teamId?: string
  responsibleWells?: string[]
  avatar?: string
  phone?: string
  email?: string
  createdAt?: string
  lastLoginAt?: string
}

export interface Block {
  id: string
  name: string
  area?: number
  location?: { lat: number; lng: number }
  description?: string
}

export interface Team {
  id: string
  name: string
  blockId: string
  leaderId?: string
  memberCount?: number
}

export interface Well {
  id: string
  name: string
  blockId: string
  longitude?: number
  latitude?: number
  oilPressure: number
  temperature: number
  status: WellStatus
  integrityRate: number
  dailyProduction: number
  cumulativeProduction?: number
  teamId?: string
  responsibleWorkerIds?: string[]
  createdAt?: string
  lastMaintenanceAt?: string
}

export interface SensorReading {
  id: string
  wellId: string
  oilPressure: number
  temperature: number
  flowRate?: number
  waterCut?: number
  casingPressure?: number
  tubingPressure?: number
  timestamp: string
}

export interface Alert {
  id: string
  type: 'sensor' | 'workorder' | 'safety' | 'system'
  level: AlertLevel
  title: string
  message: string
  sourceId?: string
  wellId?: string
  blockId?: string
  equipmentId?: string
  isRead: boolean
  readAt?: string
  createdAt: string
  upgradedAt?: string
  upgradeReason?: string
  relatedWorkOrderId?: string
}

export interface WorkOrder {
  id: string
  type: WorkOrderType
  level: AlertLevel
  wellId?: string
  equipmentId?: string
  blockId?: string
  title: string
  description: string
  assigneeTeamId: string
  assigneeUserId?: string
  status: WorkOrderStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  deadlineAt?: string
  confirmedAt?: string
  processingAt?: string
  escalatedAt?: string
  completedAt?: string
  photoUrls?: string[]
  resolution?: string
  createdBy?: string
  escalationReason?: string
}

export interface Equipment {
  id: string
  name: string
  code: string
  type: 'pump' | 'valve' | 'tank' | 'compressor' | 'generator' | 'other'
  model?: string
  manufacturer?: string
  wellId?: string
  blockId?: string
  status: EquipmentStatus
  installDate?: string
  lastMaintenanceAt?: string
  nextMaintenanceAt?: string
  maintenanceCycle?: number
  description?: string
  specifications?: Record<string, string | number>
}

export interface MaintenancePlan {
  id: string
  equipmentId: string
  title: string
  type: 'routine' | 'preventive' | 'corrective'
  scheduledAt: string
  assigneeTeamId?: string
  assigneeUserId?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  checklist?: string[]
  completedItems?: string[]
  notes?: string
  completedAt?: string
  photoUrls?: string[]
}

export interface DrillingProposal {
  id: string
  wellName: string
  blockId: string
  location: { lat: number; lng: number }
  predictedProduction: number
  estimatedDepth?: number
  estimatedCost?: number
  riskLevel: RiskLevel
  geologicalData?: Record<string, unknown>
  geologistApproval: {
    status: ApprovalStatus
    userId?: string
    time?: string
    comment?: string
  }
  chiefEngineerApproval: {
    status: ApprovalStatus
    userId?: string
    time?: string
    comment?: string
  }
  escalated: boolean
  escalatedAt?: string
  escalationReason?: string
  createdAt: string
  deadline: string
  createdBy?: string
}

export interface Tank {
  id: string
  name: string
  code: string
  blockId: string
  capacity: number
  currentLevel: number
  temperature?: number
  productType: 'crude_oil' | 'gasoline' | 'diesel' | 'kerosene' | 'other'
  status: 'normal' | 'maintenance' | 'cleaning'
  lastInspectionAt?: string
  location?: { lat: number; lng: number }
}

export interface Truck {
  id: string
  plate: string
  driverName: string
  driverPhone?: string
  capacity: number
  currentLoad?: number
  status: TruckStatus
  blockId?: string
  currentLocation?: { lat: number; lng: number }
  lastMaintenanceAt?: string
}

export interface TransportOrder {
  id: string
  tankId: string
  truckId: string
  blockId: string
  destination: string
  quantity: number
  productType: string
  status: TransportStatus
  priority: 'low' | 'medium' | 'high'
  dispatchedAt?: string
  estimatedArrivalAt?: string
  arrivedAt?: string
  completedAt?: string
  routeCoordinates?: Array<{ lat: number; lng: number }>
  currentProgress?: number
  notes?: string
  createdBy?: string
  reassignedFrom?: string
}

export interface SafetySensor {
  id: string
  name: string
  code: string
  location: string
  blockId?: string
  type: 'gas' | 'fire' | 'temperature' | 'pressure' | 'leak'
  threshold: {
    warning: number
    danger: number
  }
  currentValue: number
  unit: string
  status: 'normal' | 'warning' | 'danger' | 'offline'
  lastCalibrationAt?: string
}

export interface SafetyAlert {
  id: string
  sensorId?: string
  level: AlertLevel
  type: 'gas' | 'fire' | 'temperature' | 'pressure' | 'leak' | 'other'
  title: string
  description: string
  location: string
  blockId?: string
  valveClosed: boolean
  valveClosedAt?: string
  valveClosedBy?: string
  triggeredAt: string
  resolvedAt?: string
  resolvedBy?: string
  status: 'active' | 'resolved'
  relatedWorkOrderId?: string
}

export interface EmergencyPlan {
  id: string
  name: string
  type: 'fire' | 'gas_leak' | 'explosion' | 'environmental' | 'other'
  description: string
  steps: Array<{
    order: number
    action: string
    responsibleRole?: UserRole
    duration?: string
  }>
  contacts: Array<{
    name: string
    role?: string
    phone: string
  }>
  lastUpdatedAt: string
  isActive: boolean
}

export interface DashboardStats {
  blocks: number
  wells: number
  activeWells: number
  stoppedWells: number
  faultWells: number
  dailyProduction: number
  monthlyProduction: number
  cumulativeProduction: number
  tanks: number
  totalStorage: number
  usedStorage: number
  activeAlerts: number
  criticalAlerts: number
  pendingWorkOrders: number
  pendingApprovals: number
  teamsActive: number
  equipmentNormalRate: number
  integrityRateAvg: number
}

export interface TrendDataPoint {
  timestamp: string
  value: number
  label?: string
}

export interface ProductionTrend {
  date: string
  production: number
  wellsOperated: number
}

export interface BlockStats {
  blockId: string
  blockName: string
  wellCount: number
  dailyProduction: number
  activeAlerts: number
  integrityRate: number
}

export interface ApprovalRecord {
  id: string
  proposalId?: string
  workOrderId?: string
  approverRole: UserRole
  approverId?: string
  approverName?: string
  status: ApprovalStatus
  comment?: string
  approvedAt?: string
}

export interface MenuItem {
  key: string
  label: string
  icon?: string
  path: string
  module: ModuleName
  children?: MenuItem[]
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ExportReportRequest {
  month?: string
  blockId?: string
  format: 'pdf' | 'excel' | 'word'
}

export interface ExportReportResponse {
  downloadUrl: string
  fileName: string
}

export type {
  WellStatus as WellStatusEnum,
  WorkOrderStatus as WorkOrderStatusEnum,
  WorkOrderType as WorkOrderTypeEnum,
  ApprovalStatus as ApprovalStatusEnum,
  RiskLevel as RiskLevelEnum,
  TransportStatus as TransportStatusEnum,
  EquipmentStatus as EquipmentStatusEnum,
  TruckStatus as TruckStatusEnum,
}
