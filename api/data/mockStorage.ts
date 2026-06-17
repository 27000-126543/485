import type {
  User,
  Block,
  WellData,
  Tank,
  TankType,
  Truck,
  TransportOrder,
} from '../../shared/types.js';

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const tankConfigs: Array<{
  type: TankType;
  capacityRange: [number, number];
  nameSuffix: string;
}> = [
  { type: 'crude_oil', capacityRange: [2000, 5000], nameSuffix: '号原油储罐' },
  { type: 'crude_oil', capacityRange: [2000, 5000], nameSuffix: '号原油储罐' },
  { type: 'diesel', capacityRange: [500, 1000], nameSuffix: '号柴油储罐' },
  { type: 'gasoline', capacityRange: [300, 800], nameSuffix: '号汽油储罐' },
  { type: 'chemical', capacityRange: [200, 500], nameSuffix: '号化学品储罐' },
  { type: 'water', capacityRange: [1000, 2000], nameSuffix: '号采出水储罐' },
];

const tankTypeNames: Record<TankType, string> = {
  crude_oil: '原油',
  diesel: '柴油',
  gasoline: '汽油',
  chemical: '化学品',
  water: '采出水',
};

const truckDrivers = [
  { name: '马建国', phone: '13900010001' },
  { name: '杨德发', phone: '13900010002' },
  { name: '黄守义', phone: '13900010003' },
  { name: '朱光远', phone: '13900010004' },
  { name: '胡云鹏', phone: '13900010005' },
  { name: '林志强', phone: '13900010006' },
  { name: '何海波', phone: '13900010007' },
  { name: '高志勇', phone: '13900010008' },
];

const destinations = [
  '中石油华北炼油厂',
  '中石化齐鲁分公司',
  '地方炼油厂一厂',
  '国家石油储备库',
  '区域油品配送中心',
  '化工园区原料库',
];

export const generateMockStorageData = (
  blocks: Block[],
  users: User[],
  wells: WellData[]
): { tanks: Tank[]; trucks: Truck[]; transportOrders: TransportOrder[] } => {
  const tanks: Tank[] = [];
  const trucks: Truck[] = [];
  const transportOrders: TransportOrder[] = [];

  const hqAdmins = users.filter((u) => u.role === 'hq_admin');
  const supplyManagers = users.filter((u) => u.role === 'supply_manager');
  const oilWorkers = users.filter((u) => u.role === 'oil_worker');

  let tankIndex = 0;
  blocks.slice(0, 2).forEach((block) => {
    tankConfigs.forEach((config) => {
      const capacity = config.capacityRange[0] + Math.random() * (config.capacityRange[1] - config.capacityRange[0]);
      const currentLevel = capacity * (0.35 + Math.random() * 0.55);
      const temperature = config.type === 'crude_oil' ? 35 + Math.random() * 25 : 10 + Math.random() * 30;
      const pressure = config.type === 'crude_oil' ? 0.1 + Math.random() * 0.3 : 0.05 + Math.random() * 0.15;
      const statuses: Tank['status'][] = ['normal', 'normal', 'normal', 'filling', 'emptying', 'maintenance'];

      const inspectionDate = new Date();
      inspectionDate.setMonth(inspectionDate.getMonth() - 2 - (tankIndex % 4));
      const nextInspection = new Date(inspectionDate);
      nextInspection.setMonth(nextInspection.getMonth() + 6);

      const tank: Tank = {
        id: generateId(),
        code: `${block.code.toUpperCase()}-TK-${String(tankIndex + 1).padStart(3, '0')}`,
        name: `${block.name}${tankIndex % 3 + 1}${config.nameSuffix}`,
        blockId: block.id,
        type: config.type,
        capacity: Math.round(capacity * 100) / 100,
        currentLevel: Math.round(currentLevel * 100) / 100,
        temperature: Math.round(temperature * 100) / 100,
        pressure: Math.round(pressure * 1000) / 1000,
        lastInspectionDate: inspectionDate.toISOString(),
        nextInspectionDate: nextInspection.toISOString(),
        status: statuses[tankIndex % statuses.length],
        createdAt: `2023-0${(tankIndex % 9) + 1}-1${tankIndex % 9}T08:00:00.000Z`,
      };

      tanks.push(tank);
      tankIndex++;
    });
  });

  const plates = ['京A', '冀B', '蒙C', '新D', '鲁E', '苏F', '浙G', '粤H'];
  const truckStatuses: Truck['status'][] = ['idle', 'loading', 'transporting', 'transporting', 'unloading', 'idle', 'maintenance', 'transporting'];
  const capacityOptions = [20, 25, 30, 30, 35, 40, 45, 50];

  for (let i = 0; i < 8; i++) {
    const driver = truckDrivers[i];
    const platePrefix = plates[i];
    const plateNum = String(50000 + i * 123).padStart(5, '0');
    const blockIdx = i % blocks.length;
    const status = truckStatuses[i];
    const capacity = capacityOptions[i];
    const currentLoad = status === 'transporting' || status === 'unloading'
      ? capacity * (0.7 + Math.random() * 0.3)
      : status === 'loading'
      ? capacity * (0.2 + Math.random() * 0.5)
      : 0;

    const maintenanceDate = new Date();
    maintenanceDate.setDate(maintenanceDate.getDate() - (20 + i * 5));
    const nextMaintenance = new Date(maintenanceDate);
    nextMaintenance.setDate(nextMaintenance.getDate() + 90);

    const truck: Truck = {
      id: generateId(),
      code: `TRK-${String(i + 1).padStart(3, '0')}`,
      plateNumber: `${platePrefix}·${plateNum}挂`,
      driverName: driver.name,
      driverPhone: driver.phone,
      capacity,
      currentLoad: Math.round(currentLoad * 100) / 100,
      status,
      blockId: blocks[blockIdx].id,
      lastMaintenanceDate: maintenanceDate.toISOString(),
      nextMaintenanceDate: nextMaintenance.toISOString(),
      currentLocation: status === 'transporting'
        ? `G${(i % 6) + 1}高速 距目的地${30 + i * 8}公里`
        : undefined,
      createdAt: `2023-0${(i % 9) + 1}-1${i % 9}T08:00:00.000Z`,
    };

    trucks.push(truck);
  }

  const transportingTrucks = trucks.filter((t) => t.status === 'transporting' || t.status === 'loading' || t.status === 'unloading');
  const orderStatuses: TransportOrder['status'][] = ['pending', 'loading', 'in_transit', 'in_transit', 'delivered', 'delivered', 'delivered', 'cancelled'];
  const materialTypes: TankType[] = ['crude_oil', 'crude_oil', 'diesel', 'crude_oil', 'gasoline', 'chemical', 'crude_oil', 'water'];

  for (let i = 0; i < 8; i++) {
    const truck = transportingTrucks[i % transportingTrucks.length];
    const blockIdx = i % blocks.length;
    const sourceBlock = blocks[blockIdx];
    const blockTanks = tanks.filter((t) => t.blockId === sourceBlock.id && t.type === materialTypes[i]);
    const sourceTank = blockTanks[0];
    const status = orderStatuses[i];

    const departure = new Date();
    departure.setDate(departure.getDate() - (i % 3));
    departure.setHours(8 + (i % 8), 0, 0, 0);
    const arrival = new Date(departure);
    arrival.setHours(arrival.getHours() + 4 + (i % 6));

    const order: TransportOrder = {
      id: generateId(),
      code: `TO-${2026}${String(i + 1).padStart(4, '0')}`,
      truckId: truck.id,
      tankId: sourceTank?.id,
      sourceBlockId: sourceBlock.id,
      destination: destinations[i % destinations.length],
      materialType: materialTypes[i],
      quantity: Math.round((truck.capacity * (0.75 + Math.random() * 0.2)) * 100) / 100,
      status,
      driverId: oilWorkers[i % Math.max(oilWorkers.length, 1)].id,
      dispatcherId: supplyManagers[0]?.id || hqAdmins[0]?.id || users[0].id,
      departureTime: status !== 'pending' ? departure.toISOString() : undefined,
      arrivalTime: status === 'delivered' ? arrival.toISOString() : undefined,
      estimatedDuration: 240 + (i % 4) * 60,
      notes: i % 3 === 0 ? `${tankTypeNames[materialTypes[i]]}专项运输` : undefined,
      createdAt: departure.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    transportOrders.push(order);
  }

  return { tanks, trucks, transportOrders };
};
