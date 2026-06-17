import type {
  User,
  Block,
  Team,
  WellData,
  WorkOrder,
  DrillingProposal,
  Tank,
  Truck,
  TransportOrder,
  SafetyAlert,
  SafetySensor,
  Equipment,
  DrillingRig,
  MaterialStock,
  PurchaseRequest,
  InspectionPlan,
  DashboardStats,
  RepairOrder,
  SystemRules,
} from '../../shared/types.js';
import { generateMockUsers, generateIdHelper } from './mockUsers.js';
import { generateMockBlocksAndWells } from './mockWells.js';
import { generateMockDrillingData } from './mockDrilling.js';
import { generateMockWorkOrders } from './mockProduction.js';
import { generateMockStorageData } from './mockStorage.js';
import { generateMockEquipmentData } from './mockEquipment.js';
import { generateMockSafetyData } from './mockSafety.js';

export interface SensorDataPoint {
  id: string;
  wellId: string;
  timestamp: string;
  pressure: number;
  temperature: number;
  flowRate: number;
  waterCut: number;
}

export interface TokenRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface DataStore {
  users: User[];
  blocks: Block[];
  teams: Team[];
  wells: WellData[];
  workOrders: WorkOrder[];
  drillingProposals: DrillingProposal[];
  tanks: Tank[];
  trucks: Truck[];
  transportOrders: TransportOrder[];
  safetyAlerts: SafetyAlert[];
  safetySensors: SafetySensor[];
  equipment: Equipment[];
  drillingRigs: DrillingRig[];
  materialStocks: MaterialStock[];
  purchaseRequests: PurchaseRequest[];
  inspectionPlans: InspectionPlan[];
  repairOrders: RepairOrder[];
  tokens: TokenRecord[];
  sensorData: SensorDataPoint[];
  systemRules: SystemRules;
  initialized: boolean;
}

class GlobalDataStore {
  private static instance: GlobalDataStore;
  private data: DataStore;

  private constructor() {
    this.data = {
      users: [],
      blocks: [],
      teams: [],
      wells: [],
      workOrders: [],
      drillingProposals: [],
      tanks: [],
      trucks: [],
      transportOrders: [],
      safetyAlerts: [],
      safetySensors: [],
      equipment: [],
      drillingRigs: [],
      materialStocks: [],
      purchaseRequests: [],
      inspectionPlans: [],
      repairOrders: [],
      tokens: [],
      sensorData: [],
      systemRules: {
        workOrderTimeoutHours: 24,
        purchaseRequestTimeoutHours: 48,
        alertAutoResolveHours: 72,
        inspectionReminderDays: 3,
        maintenanceReminderDays: 7,
      },
      initialized: false,
    };
  }

  public static getInstance(): GlobalDataStore {
    if (!GlobalDataStore.instance) {
      GlobalDataStore.instance = new GlobalDataStore();
    }
    return GlobalDataStore.instance;
  }

  public initMockData(): void {
    if (this.data.initialized) return;

    const users = generateMockUsers();
    this.data.users = users;

    const { blocks, teams, wells } = generateMockBlocksAndWells(users);
    this.data.blocks = blocks;
    this.data.teams = teams;
    this.data.wells = wells;

    const { drillingProposals, drillingRigs, materialStocks, purchaseRequests } = generateMockDrillingData(blocks, users, wells);
    this.data.drillingProposals = drillingProposals;
    this.data.drillingRigs = drillingRigs;
    this.data.materialStocks = materialStocks;
    this.data.purchaseRequests = purchaseRequests;

    this.data.workOrders = generateMockWorkOrders(wells, blocks, teams, users);

    const { tanks, trucks, transportOrders } = generateMockStorageData(blocks, users, wells);
    this.data.tanks = tanks;
    this.data.trucks = trucks;
    this.data.transportOrders = transportOrders;

    const { equipment, inspectionPlans } = generateMockEquipmentData(blocks, wells, teams, users);
    this.data.equipment = equipment;
    this.data.inspectionPlans = inspectionPlans;

    const { safetySensors, safetyAlerts } = generateMockSafetyData(blocks, wells);
    this.data.safetySensors = safetySensors;
    this.data.safetyAlerts = safetyAlerts;

    this.data.sensorData = this.generateSensorData(wells);
    this.data.repairOrders = this.generateMockRepairOrders(equipment, users, blocks, wells);

    this.data.initialized = true;
  }

  private generateSensorData(wells: WellData[]): SensorDataPoint[] {
    const data: SensorDataPoint[] = [];
    const now = new Date();
    wells.forEach((well) => {
      for (let i = 0; i < 20; i++) {
        const t = new Date(now.getTime() - i * 30 * 60 * 1000);
        data.push({
          id: generateIdHelper(),
          wellId: well.id,
          timestamp: t.toISOString(),
          pressure: Math.round((well.pressure + (Math.random() - 0.5) * 2) * 100) / 100,
          temperature: Math.round((well.temperature + (Math.random() - 0.5) * 5) * 100) / 100,
          flowRate: Math.round(well.dailyProduction / 24 * (0.9 + Math.random() * 0.2) * 100) / 100,
          waterCut: Math.round((10 + Math.random() * 15) * 100) / 100,
        });
      }
    });
    return data;
  }

  private generateMockRepairOrders(
    equipment: Equipment[],
    users: User[],
    blocks: Block[],
    wells: WellData[]
  ): RepairOrder[] {
    const statuses: RepairOrder['status'][] = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    const priorities: RepairOrder['priority'][] = ['low', 'medium', 'high', 'urgent'];
    const orders: RepairOrder[] = [];
    const maintUsers = users.filter((u) => u.role === 'team_leader' || u.role === 'oil_worker');
    for (let i = 0; i < 15; i++) {
      const eq = equipment[i % equipment.length];
      const reporter = users[i % users.length];
      const assignee = maintUsers[i % maintUsers.length];
      const now = new Date();
      const created = new Date(now.getTime() - i * 86400000);
      orders.push({
        id: generateIdHelper(),
        code: `RO-${String(i + 1).padStart(4, '0')}`,
        title: `${eq.name} 报修 - ${['振动异常', '温度过高', '压力不足', '漏油', '异响'][i % 5]}`,
        description: `设备 ${eq.code} 出现故障，需要维修处理。`,
        equipmentId: eq.id,
        wellId: eq.wellId,
        blockId: eq.blockId,
        reportedBy: reporter.id,
        assignedTo: assignee.id,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        faultType: ['mechanical', 'electrical', 'hydraulic', 'instrumentation'][i % 4] as RepairOrder['faultType'],
        estimatedCost: Math.round(Math.random() * 50000) / 100,
        reportedAt: created.toISOString(),
        acceptedAt: i % 3 !== 0 ? new Date(created.getTime() + 3600000).toISOString() : undefined,
        completedAt: i % 4 === 3 ? new Date(created.getTime() + 86400000).toISOString() : undefined,
        photoUrls: i % 4 === 3 ? [`/photos/repair-${i + 1}-1.jpg`, `/photos/repair-${i + 1}-2.jpg`] : undefined,
        notes: i % 4 === 3 ? '已更换损坏零件，设备恢复正常运行' : undefined,
        createdAt: created.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
    return orders;
  }

  public getData(): DataStore {
    if (!this.data.initialized) {
      this.initMockData();
    }
    return this.data;
  }

  public getUsers(): User[] {
    return this.getData().users;
  }

  public findUserByUsername(username: string): User | undefined {
    return this.getData().users.find((u) => u.username === username);
  }

  public findUserById(id: string): User | undefined {
    return this.getData().users.find((u) => u.id === id);
  }

  public getBlocks(): Block[] {
    return this.getData().blocks;
  }

  public findBlockById(id: string): Block | undefined {
    return this.getData().blocks.find((b) => b.id === id);
  }

  public getWells(blockId?: string): WellData[] {
    const wells = this.getData().wells;
    if (blockId) {
      return wells.filter((w) => w.blockId === blockId);
    }
    return wells;
  }

  public findWellById(id: string): WellData | undefined {
    return this.getData().wells.find((w) => w.id === id);
  }

  public getWorkOrders(wellId?: string, blockId?: string): WorkOrder[] {
    let orders = this.getData().workOrders;
    if (wellId) orders = orders.filter((o) => o.wellId === wellId);
    if (blockId) orders = orders.filter((o) => o.blockId === blockId);
    return orders;
  }

  public getDashboardStats(): DashboardStats {
    const data = this.getData();
    const totalWells = data.wells.length;
    const producingWells = data.wells.filter((w) => w.status === 'producing').length;
    const totalBlocks = data.blocks.length;
    const dailyProduction = data.wells.reduce((sum, w) => sum + w.dailyProduction, 0);
    const monthlyProduction = dailyProduction * 30;
    const cumulativeProduction = data.wells.reduce((sum, w) => sum + w.cumulativeProduction, 0);
    const activeWorkOrders = data.workOrders.filter(
      (o) => o.status === 'in_progress' || o.status === 'pending'
    ).length;
    const pendingWorkOrders = data.workOrders.filter((o) => o.status === 'pending').length;
    const totalEquipment = data.equipment.length;
    const operationalEquipment = data.equipment.filter((e) => e.status === 'operational').length;
    const totalTanks = data.tanks.length;
    const totalStockValue = data.materialStocks.reduce((sum, m) => sum + m.currentStock * m.unitPrice, 0);
    const activeAlerts = data.safetyAlerts.filter((a) => !a.resolved).length;
    const criticalAlerts = data.safetyAlerts.filter((a) => !a.resolved && (a.level === 'danger' || a.level === 'critical')).length;
    const trucksInTransit = data.trucks.filter((t) => t.status === 'transporting').length;
    const activeDrilling = data.drillingProposals.filter((p) => p.status === 'in_progress').length;

    const blockStats = data.blocks.map((block) => ({
      blockId: block.id,
      blockName: block.name,
      wellCount: data.wells.filter((w) => w.blockId === block.id).length,
      dailyProduction: data.wells.filter((w) => w.blockId === block.id).reduce((sum, w) => sum + w.dailyProduction, 0),
      activeAlerts: data.safetyAlerts.filter((a) => a.blockId === block.id && !a.resolved).length,
    }));

    const today = new Date();
    const productionTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const factor = 0.85 + Math.random() * 0.3;
      return {
        date: d.toISOString().split('T')[0],
        production: Math.round(dailyProduction * factor * 100) / 100,
      };
    });

    const alertTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 8) + 1,
      };
    });

    return {
      totalWells,
      producingWells,
      totalBlocks,
      dailyProduction: Math.round(dailyProduction * 100) / 100,
      monthlyProduction: Math.round(monthlyProduction * 100) / 100,
      cumulativeProduction: Math.round(cumulativeProduction * 100) / 100,
      activeWorkOrders,
      pendingWorkOrders,
      totalEquipment,
      operationalEquipment,
      totalTanks,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      activeAlerts,
      criticalAlerts,
      trucksInTransit,
      activeDrilling,
      blockStats,
      productionTrend,
      alertTrend,
    };
  }

  public createToken(userId: string): TokenRecord {
    const token = 'tk_' + generateIdHelper() + generateIdHelper();
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const record: TokenRecord = {
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    this.getData().tokens.push(record);
    return record;
  }

  public findToken(token: string): TokenRecord | undefined {
    const t = this.getData().tokens.find((x) => x.token === token);
    if (!t) return undefined;
    if (new Date(t.expiresAt) < new Date()) return undefined;
    return t;
  }

  public revokeToken(token: string): void {
    const idx = this.getData().tokens.findIndex((x) => x.token === token);
    if (idx >= 0) this.getData().tokens.splice(idx, 1);
  }

  public getUserByToken(token: string): User | undefined {
    const rec = this.findToken(token);
    if (!rec) return undefined;
    return this.findUserById(rec.userId);
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const u: User = {
      ...user,
      id: generateIdHelper(),
      createdAt: new Date().toISOString(),
    };
    this.getData().users.push(u);
    return u;
  }

  public updateUser(id: string, patch: Partial<User>): User | undefined {
    const idx = this.getData().users.findIndex((u) => u.id === id);
    if (idx < 0) return undefined;
    this.getData().users[idx] = { ...this.getData().users[idx], ...patch };
    return this.getData().users[idx];
  }

  public deleteUser(id: string): boolean {
    const idx = this.getData().users.findIndex((u) => u.id === id);
    if (idx < 0) return false;
    this.getData().users.splice(idx, 1);
    return true;
  }

  public getDrillingProposals(blockId?: string): DrillingProposal[] {
    let list = this.getData().drillingProposals;
    if (blockId) list = list.filter((p) => p.blockId === blockId);
    return list;
  }

  public findDrillingProposalById(id: string): DrillingProposal | undefined {
    return this.getData().drillingProposals.find((p) => p.id === id);
  }

  public createDrillingProposal(data: Omit<DrillingProposal, 'id' | 'code' | 'status' | 'createdAt' | 'updatedAt'>): DrillingProposal {
    const list = this.getData().drillingProposals;
    const next = list.length + 1;
    const now = new Date().toISOString();
    const p: DrillingProposal = {
      ...data,
      id: generateIdHelper(),
      code: `DP-${String(next).padStart(4, '0')}`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    list.push(p);
    return p;
  }

  public updateDrillingProposal(id: string, patch: Partial<DrillingProposal>): DrillingProposal | undefined {
    const list = this.getData().drillingProposals;
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return undefined;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    return list[idx];
  }

  public getDrillingRigs(): DrillingRig[] {
    return this.getData().drillingRigs;
  }

  public getMaterialStocks(): MaterialStock[] {
    return this.getData().materialStocks;
  }

  public getPurchaseRequests(): PurchaseRequest[] {
    return this.getData().purchaseRequests;
  }

  public findPurchaseRequestById(id: string): PurchaseRequest | undefined {
    return this.getData().purchaseRequests.find((p) => p.id === id);
  }

  public createPurchaseRequest(data: Omit<PurchaseRequest, 'id' | 'code' | 'status' | 'createdAt' | 'updatedAt'>): PurchaseRequest {
    const list = this.getData().purchaseRequests;
    const next = list.length + 1;
    const now = new Date().toISOString();
    const pr: PurchaseRequest = {
      ...data,
      id: generateIdHelper(),
      code: `PR-${String(next).padStart(4, '0')}`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    list.push(pr);
    return pr;
  }

  public updatePurchaseRequest(id: string, patch: Partial<PurchaseRequest>): PurchaseRequest | undefined {
    const list = this.getData().purchaseRequests;
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return undefined;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    return list[idx];
  }

  public findWorkOrderById(id: string): WorkOrder | undefined {
    return this.getData().workOrders.find((o) => o.id === id);
  }

  public createWorkOrder(data: Omit<WorkOrder, 'id' | 'code' | 'status' | 'createdAt' | 'updatedAt'>): WorkOrder {
    const list = this.getData().workOrders;
    const next = list.length + 1;
    const now = new Date().toISOString();
    const wo: WorkOrder = {
      ...data,
      id: generateIdHelper(),
      code: `WO-${String(next).padStart(4, '0')}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    list.push(wo);
    return wo;
  }

  public updateWorkOrder(id: string, patch: Partial<WorkOrder>): WorkOrder | undefined {
    const list = this.getData().workOrders;
    const idx = list.findIndex((o) => o.id === id);
    if (idx < 0) return undefined;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    return list[idx];
  }

  public getSensorDataByWellId(wellId: string, limit = 20): SensorDataPoint[] {
    return this.getData().sensorData
      .filter((s) => s.wellId === wellId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public getTeams(blockId?: string): Team[] {
    let list = this.getData().teams;
    if (blockId) list = list.filter((t) => t.blockId === blockId);
    return list;
  }

  public findTeamById(id: string): Team | undefined {
    return this.getData().teams.find((t) => t.id === id);
  }

  public getTanks(blockId?: string): Tank[] {
    let list = this.getData().tanks;
    if (blockId) list = list.filter((t) => t.blockId === blockId);
    return list;
  }

  public getTrucks(blockId?: string): Truck[] {
    let list = this.getData().trucks;
    if (blockId) list = list.filter((t) => t.blockId === blockId);
    return list;
  }

  public getTransportOrders(): TransportOrder[] {
    return this.getData().transportOrders;
  }

  public findTransportOrderById(id: string): TransportOrder | undefined {
    return this.getData().transportOrders.find((t) => t.id === id);
  }

  public createTransportOrder(data: Omit<TransportOrder, 'id' | 'code' | 'status' | 'createdAt' | 'updatedAt'>): TransportOrder {
    const list = this.getData().transportOrders;
    const next = list.length + 1;
    const now = new Date().toISOString();
    const to: TransportOrder = {
      ...data,
      id: generateIdHelper(),
      code: `TO-${String(next).padStart(4, '0')}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    list.push(to);
    return to;
  }

  public updateTransportOrder(id: string, patch: Partial<TransportOrder>): TransportOrder | undefined {
    const list = this.getData().transportOrders;
    const idx = list.findIndex((t) => t.id === id);
    if (idx < 0) return undefined;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    return list[idx];
  }

  public getEquipment(blockId?: string): Equipment[] {
    let list = this.getData().equipment;
    if (blockId) list = list.filter((e) => e.blockId === blockId);
    return list;
  }

  public findEquipmentById(id: string): Equipment | undefined {
    return this.getData().equipment.find((e) => e.id === id);
  }

  public getInspectionPlans(blockId?: string): InspectionPlan[] {
    let list = this.getData().inspectionPlans;
    if (blockId) list = list.filter((p) => p.blockId === blockId);
    return list;
  }

  public getRepairOrders(blockId?: string): RepairOrder[] {
    let list = this.getData().repairOrders;
    if (blockId) list = list.filter((r) => r.blockId === blockId);
    return list;
  }

  public findRepairOrderById(id: string): RepairOrder | undefined {
    return this.getData().repairOrders.find((r) => r.id === id);
  }

  public createRepairOrder(data: Omit<RepairOrder, 'id' | 'code' | 'status' | 'reportedAt' | 'createdAt' | 'updatedAt'>): RepairOrder {
    const list = this.getData().repairOrders;
    const next = list.length + 1;
    const now = new Date().toISOString();
    const ro: RepairOrder = {
      ...data,
      id: generateIdHelper(),
      code: `RO-${String(next).padStart(4, '0')}`,
      status: 'pending',
      reportedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    list.push(ro);
    return ro;
  }

  public updateRepairOrder(id: string, patch: Partial<RepairOrder>): RepairOrder | undefined {
    const list = this.getData().repairOrders;
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return undefined;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    return list[idx];
  }

  public getSafetySensors(blockId?: string): SafetySensor[] {
    let list = this.getData().safetySensors;
    if (blockId) list = list.filter((s) => s.blockId === blockId);
    return list;
  }

  public findSafetySensorById(id: string): SafetySensor | undefined {
    return this.getData().safetySensors.find((s) => s.id === id);
  }

  public updateSafetySensor(id: string, patch: Partial<SafetySensor>): SafetySensor | undefined {
    const list = this.getData().safetySensors;
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) return undefined;
    list[idx] = { ...list[idx], ...patch };
    return list[idx];
  }

  public getSafetyAlerts(blockId?: string): SafetyAlert[] {
    let list = this.getData().safetyAlerts;
    if (blockId) list = list.filter((a) => a.blockId === blockId);
    return list;
  }

  public findSafetyAlertById(id: string): SafetyAlert | undefined {
    return this.getData().safetyAlerts.find((a) => a.id === id);
  }

  public updateSafetyAlert(id: string, patch: Partial<SafetyAlert>): SafetyAlert | undefined {
    const list = this.getData().safetyAlerts;
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return undefined;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    return list[idx];
  }

  public getSystemRules(): SystemRules {
    return this.getData().systemRules;
  }

  public updateSystemRules(patch: Partial<SystemRules>): SystemRules {
    this.getData().systemRules = { ...this.getData().systemRules, ...patch };
    return this.getData().systemRules;
  }
}

export const store = GlobalDataStore.getInstance();
