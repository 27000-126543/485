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
  | 'safety_officer';

export type AlertLevel = 'info' | 'warning' | 'danger' | 'critical';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  avatar?: string;
  blockId?: string;
  teamId?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface Block {
  id: string;
  code: string;
  name: string;
  location: string;
  area: number;
  managerId: string;
  wellCount: number;
  dailyProduction: number;
  status: 'operational' | 'maintenance' | 'closed';
  createdAt: string;
}

export interface Team {
  id: string;
  code: string;
  name: string;
  blockId: string;
  leaderId: string;
  memberIds: string[];
  shift: 'morning' | 'afternoon' | 'night';
  wellIds: string[];
  createdAt: string;
}

export interface WellData {
  id: string;
  code: string;
  name: string;
  blockId: string;
  teamId: string;
  workerId: string;
  depth: number;
  pressure: number;
  temperature: number;
  integrityRate: number;
  dailyProduction: number;
  cumulativeProduction: number;
  status: 'producing' | 'maintenance' | 'idle' | 'closed';
  lastMaintenanceDate: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'escalated';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkOrderType = 'production' | 'maintenance' | 'inspection' | 'repair';

export interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  wellId?: string;
  equipmentId?: string;
  blockId: string;
  teamId: string;
  assigneeId: string;
  assignerId: string;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  escalated?: boolean;
  escalatedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DrillingProposalStatus = 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'in_progress' | 'completed';

export interface ApprovalStep {
  status: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approvedAt?: string;
  rejectedAt?: string;
  comment?: string;
}

export interface DrillingProposal {
  id: string;
  code: string;
  title: string;
  blockId: string;
  proposedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  status: DrillingProposalStatus;
  targetDepth: number;
  estimatedCost: number;
  estimatedDuration: number;
  geologicalAssessment: string;
  equipmentRequirements: string[];
  materialRequirements: { materialId: string; quantity: number }[];
  startDate?: string;
  completionDate?: string;
  deadline?: string;
  escalated?: boolean;
  geologistApproval?: ApprovalStep;
  chiefEngineerApproval?: ApprovalStep;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TankType = 'crude_oil' | 'diesel' | 'gasoline' | 'chemical' | 'water';

export interface Tank {
  id: string;
  code: string;
  name: string;
  blockId: string;
  type: TankType;
  capacity: number;
  currentLevel: number;
  temperature: number;
  pressure: number;
  lastInspectionDate: string;
  nextInspectionDate: string;
  status: 'normal' | 'filling' | 'emptying' | 'maintenance';
  createdAt: string;
}

export type TruckStatus = 'idle' | 'loading' | 'transporting' | 'unloading' | 'maintenance';

export interface Truck {
  id: string;
  code: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  currentLoad: number;
  status: TruckStatus;
  blockId: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  currentLocation?: string;
  createdAt: string;
}

export type TransportOrderStatus = 'pending' | 'loading' | 'in_transit' | 'delivered' | 'cancelled' | 'reassigned';

export interface TransportOrder {
  id: string;
  code: string;
  truckId: string;
  tankId?: string;
  sourceBlockId: string;
  destination: string;
  materialType: TankType;
  quantity: number;
  status: TransportOrderStatus;
  driverId: string;
  dispatcherId: string;
  departureTime?: string;
  arrivalTime?: string;
  estimatedDuration: number;
  reassigned?: boolean;
  reassignedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyAlert {
  id: string;
  code: string;
  title: string;
  description: string;
  level: AlertLevel;
  sensorId?: string;
  wellId?: string;
  blockId: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export type SensorType = 'gas' | 'temperature' | 'pressure' | 'vibration' | 'fire' | 'smoke';
export type SensorStatus = 'online' | 'offline' | 'maintenance' | 'faulty';

export interface SafetySensor {
  id: string;
  code: string;
  name: string;
  type: SensorType;
  location: string;
  wellId?: string;
  blockId: string;
  status: SensorStatus;
  currentValue: number;
  thresholdMin: number;
  thresholdMax: number;
  unit: string;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  batteryLevel: number;
  signalStrength: number;
  lastReadingTime: string;
  createdAt: string;
}

export type EquipmentStatus = 'operational' | 'standby' | 'maintenance' | 'faulty' | 'retired';
export type EquipmentCategory = 'pump' | 'compressor' | 'generator' | 'separator' | 'heater' | 'valve' | 'motor' | 'other';

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  model: string;
  manufacturer: string;
  serialNumber: string;
  wellId?: string;
  blockId: string;
  teamId?: string;
  installDate: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  status: EquipmentStatus;
  runningHours: number;
  faultCount: number;
  specifications: Record<string, string>;
  notes?: string;
  createdAt: string;
}

export type DrillingRigStatus = 'available' | 'deployed' | 'maintenance' | 'retired';

export interface DrillingRig {
  id: string;
  code: string;
  name: string;
  model: string;
  manufacturer: string;
  maxDepth: number;
  currentDepth?: number;
  blockId?: string;
  proposalId?: string;
  status: DrillingRigStatus;
  crewSize: number;
  powerRating: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  totalDrillingHours: number;
  specifications: Record<string, string>;
  createdAt: string;
}

export type MaterialCategory = 'drilling' | 'production' | 'maintenance' | 'safety' | 'chemical';

export interface MaterialStock {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  supplier: string;
  warehouse: string;
  lastRestockDate: string;
  specifications: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseRequestStatus = 'draft' | 'submitted' | 'first_approved' | 'second_approved' | 'approved' | 'rejected' | 'ordered' | 'received';

export interface PurchaseRequest {
  id: string;
  code: string;
  title: string;
  requestedBy: string;
  approvedBy?: string;
  firstApprovedBy?: string;
  firstApprovedAt?: string;
  firstApprovalComment?: string;
  secondApprovedBy?: string;
  secondApprovedAt?: string;
  secondApprovalComment?: string;
  department: string;
  status: PurchaseRequestStatus;
  autoGenerated?: boolean;
  triggeredByMaterialId?: string;
  triggeredByStockLevel?: number;
  totalAmount: number;
  items: { materialId: string; materialName: string; quantity: number; unitPrice: number }[];
  urgency: 'low' | 'medium' | 'high';
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InspectionFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type InspectionPlanStatus = 'active' | 'inactive' | 'completed';

export interface InspectionPlan {
  id: string;
  code: string;
  title: string;
  description: string;
  equipmentId?: string;
  wellId?: string;
  blockId: string;
  assigneeId: string;
  frequency: InspectionFrequency;
  status: InspectionPlanStatus;
  checkItems: string[];
  startDate: string;
  endDate?: string;
  lastInspectionDate?: string;
  nextInspectionDate: string;
  notes?: string;
  createdAt: string;
}

export type RepairOrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'escalated';
export type RepairOrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RepairFaultType = 'mechanical' | 'electrical' | 'hydraulic' | 'instrumentation' | 'other';

export interface RepairOrder {
  id: string;
  code: string;
  title: string;
  description: string;
  equipmentId: string;
  wellId?: string;
  blockId: string;
  reportedBy: string;
  assignedTo?: string;
  status: RepairOrderStatus;
  priority: RepairOrderPriority;
  faultType: RepairFaultType;
  estimatedCost: number;
  reportedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  escalated?: boolean;
  escalatedAt?: string;
  photoUrls?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemRules {
  workOrderTimeoutHours: number;
  purchaseRequestTimeoutHours: number;
  alertAutoResolveHours: number;
  inspectionReminderDays: number;
  maintenanceReminderDays: number;
}

export type ModuleName =
  | 'dashboard'
  | 'geology'
  | 'drilling'
  | 'production'
  | 'storage'
  | 'equipment'
  | 'safety'
  | 'system';

export interface DashboardStats {
  totalWells: number;
  producingWells: number;
  totalBlocks: number;
  dailyProduction: number;
  monthlyProduction: number;
  cumulativeProduction: number;
  activeWorkOrders: number;
  pendingWorkOrders: number;
  totalEquipment: number;
  operationalEquipment: number;
  totalTanks: number;
  totalStockValue: number;
  activeAlerts: number;
  criticalAlerts: number;
  trucksInTransit: number;
  activeDrilling: number;
  blockStats: {
    blockId: string;
    blockName: string;
    wellCount: number;
    dailyProduction: number;
    activeAlerts: number;
  }[];
  productionTrend: { date: string; production: number }[];
  alertTrend: { date: string; count: number }[];
}
