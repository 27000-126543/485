import type {
  Block,
  WellData,
  SafetySensor,
  SensorType,
  SafetyAlert,
  AlertLevel,
} from '../../shared/types.js';

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const sensorTypeConfig: Record<SensorType, {
  namePrefix: string;
  unit: string;
  threshold: { min: number; max: number };
  normalRange: [number, number];
}> = {
  gas: {
    namePrefix: '可燃气体探测器',
    unit: '%LEL',
    threshold: { min: 0, max: 25 },
    normalRange: [0, 10],
  },
  temperature: {
    namePrefix: '温度监测传感器',
    unit: '℃',
    threshold: { min: -20, max: 120 },
    normalRange: [10, 80],
  },
  pressure: {
    namePrefix: '压力监测传感器',
    unit: 'MPa',
    threshold: { min: 0, max: 32 },
    normalRange: [2, 20],
  },
  vibration: {
    namePrefix: '振动监测传感器',
    unit: 'mm/s',
    threshold: { min: 0, max: 15 },
    normalRange: [0, 5],
  },
  fire: {
    namePrefix: '红外火焰探测器',
    unit: 'AU',
    threshold: { min: 0, max: 1000 },
    normalRange: [0, 50],
  },
  smoke: {
    namePrefix: '烟雾浓度传感器',
    unit: 'ppm',
    threshold: { min: 0, max: 500 },
    normalRange: [0, 80],
  },
};

const alertTemplates: Array<{
  level: AlertLevel;
  titles: string[];
  descriptions: string[];
}> = [
  {
    level: 'info',
    titles: ['传感器数据异常波动', '设备运行参数偏离正常区间', '系统自检完成'],
    descriptions: [
      '监测数据出现轻微波动，暂未超过预警阈值，建议持续关注。',
      '运行参数偏离正常区间较小，可能由工况调整引起，确认是否为计划性操作。',
      '系统完成周期自检，所有子系统运行正常，无异常项。',
    ],
  },
  {
    level: 'warning',
    titles: ['可燃气体浓度接近预警阈值', '设备温度持续升高', '压力变化速率过快', '振动值接近警戒值'],
    descriptions: [
      '可燃气体浓度持续上升，已接近20%LEL预警阈值，请现场巡检人员确认是否存在渗漏。',
      '设备轴承温度在过去30分钟内上升超过8℃，建议检查冷却系统和润滑状况。',
      '管线压力5分钟内变化超过1.5MPa，请检查上下游阀门开关状态及输送工况。',
      '旋转设备振动值接近警戒范围，建议安排精密振动分析，判断是否存在不平衡或不对中。',
    ],
  },
  {
    level: 'danger',
    titles: ['可燃气体浓度超标报警', '设备超温停机保护', '压力超高紧急切断', '烟雾浓度异常升高'],
    descriptions: [
      '可燃气体浓度超过25%LEL报警阈值，现场声光报警已启动，请立即启动应急预案，人员撤离至上风口。',
      '设备温度超过120℃保护阈值，控制系统已执行停机保护，检查冷却系统是否故障。',
      '系统压力超过32MPa上限，紧急切断阀已自动关闭，排查压力异常升高原因，确认泄压后再恢复。',
      '烟雾传感器检测到异常浓度升高，可能存在阴燃或电气过热，现场核实火源并启动消防处置流程。',
    ],
  },
  {
    level: 'critical',
    titles: ['火焰探测确认报警', '多传感器联动异常', '井口压力异常骤降'],
    descriptions: [
      '红外+紫外双波段火焰探测器确认火灾，消防喷淋系统已启动，立即报火警并组织人员疏散。',
      '同一区域内气体、温度、烟雾多参数同时异常，判定为重大安全事件，启动一级响应。',
      '井口生产压力在短时间内骤降超过50%，疑似井下管柱泄漏或套管破损，立即关井并上报。',
    ],
  },
];

export const generateMockSafetyData = (
  blocks: Block[],
  wells: WellData[]
): { safetySensors: SafetySensor[]; safetyAlerts: SafetyAlert[] } => {
  const safetySensors: SafetySensor[] = [];
  const safetyAlerts: SafetyAlert[] = [];

  const sensorTypes: SensorType[] = ['gas', 'temperature', 'pressure', 'vibration', 'fire', 'smoke'];
  const totalSensors = 20;

  for (let i = 0; i < totalSensors; i++) {
    const typeIdx = i % sensorTypes.length;
    const type = sensorTypes[typeIdx];
    const config = sensorTypeConfig[type];

    const blockIdx = i % blocks.length;
    const block = blocks[blockIdx];
    const blockWells = wells.filter((w) => w.blockId === block.id);
    const well = (type === 'pressure' || type === 'temperature' || type === 'gas') && i % 3 !== 0
      ? blockWells[i % Math.max(blockWells.length, 1)]
      : undefined;

    const normalValue = config.normalRange[0] + Math.random() * (config.normalRange[1] - config.normalRange[0]);
    const isFault = i % 13 === 0;
    const isOverThreshold = !isFault && (i % 9 === 0 || i % 11 === 0);
    const currentValue = isFault
      ? -9999
      : isOverThreshold
      ? config.threshold.max * (1.05 + Math.random() * 0.2)
      : normalValue;

    const statuses: SafetySensor['status'][] = ['online', 'online', 'online', 'online', 'online', 'offline', 'maintenance', 'faulty'];
    const status = isFault ? 'faulty' : statuses[i % statuses.length];

    const calibrationDate = new Date();
    calibrationDate.setMonth(calibrationDate.getMonth() - (1 + (i % 5)));
    const nextCalibration = new Date(calibrationDate);
    nextCalibration.setMonth(nextCalibration.getMonth() + 6);

    const lastReading = new Date();
    lastReading.setMinutes(lastReading.getMinutes() - (i % 15));

    const locations = [
      '井口采油树', '计量间分离器区', '输油泵房', '储油罐区防火堤',
      '压缩机厂房', '配电室', '天然气处理装置区', '锅炉房',
      '装卸车台', '办公区走廊',
    ];

    const sensor: SafetySensor = {
      id: generateId(),
      code: `SNS-${type.toUpperCase().slice(0, 3)}-${String(i + 1).padStart(4, '0')}`,
      name: `${config.namePrefix}#${i + 1}`,
      type,
      location: well ? well.name : locations[i % locations.length],
      wellId: well?.id,
      blockId: block.id,
      status,
      currentValue: Math.round(currentValue * 100) / 100,
      thresholdMin: config.threshold.min,
      thresholdMax: config.threshold.max,
      unit: config.unit,
      lastCalibrationDate: calibrationDate.toISOString(),
      nextCalibrationDate: nextCalibration.toISOString(),
      batteryLevel: status === 'faulty' ? 5 + Math.random() * 15 : 55 + Math.random() * 45,
      signalStrength: status === 'offline' ? 0 : status === 'faulty' ? 15 : 65 + Math.random() * 35,
      lastReadingTime: status === 'offline' ? lastReading.toISOString() : new Date().toISOString(),
      createdAt: `2024-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, '0')}T08:00:00.000Z`,
    };

    safetySensors.push(sensor);
  }

  const alertCount = 18;

  for (let i = 0; i < alertCount; i++) {
    const levelIdx = i % alertTemplates.length;
    const levelConfig = alertTemplates[levelIdx];
    const titleIdx = Math.floor(i / alertTemplates.length) % levelConfig.titles.length;
    const descIdx = Math.floor(i / alertTemplates.length) % levelConfig.descriptions.length;

    const level = levelConfig.level;
    const blockIdx = i % blocks.length;
    const block = blocks[blockIdx];
    const blockWells = wells.filter((w) => w.blockId === block.id);
    const blockSensors = safetySensors.filter((s) => s.blockId === block.id);

    const well = i % 4 !== 0
      ? blockWells[i % Math.max(blockWells.length, 1)]
      : undefined;
    const sensor = i % 3 !== 0
      ? blockSensors[i % Math.max(blockSensors.length, 1)]
      : undefined;

    const acknowledged = level === 'info' || (level === 'warning' && i % 3 === 0);
    const resolved = acknowledged && (i % 2 === 0);
    const now = new Date();
    const createdAt = new Date(now);
    createdAt.setMinutes(createdAt.getMinutes() - (alertCount - i) * 25 - Math.floor(Math.random() * 30));
    const acknowledgedAt = acknowledged ? new Date(createdAt) : undefined;
    if (acknowledgedAt) acknowledgedAt.setMinutes(acknowledgedAt.getMinutes() + 5 + Math.floor(Math.random() * 15));
    const resolvedAt = resolved ? new Date(acknowledgedAt || createdAt) : undefined;
    if (resolvedAt) resolvedAt.setHours(resolvedAt.getHours() + 1 + Math.floor(Math.random() * 4));

    const alert: SafetyAlert = {
      id: generateId(),
      code: `ALT-${String(2026)}${String(i + 1).padStart(5, '0')}`,
      title: levelConfig.titles[titleIdx],
      description: levelConfig.descriptions[descIdx],
      level,
      sensorId: sensor?.id,
      wellId: well?.id,
      blockId: block.id,
      acknowledged,
      acknowledgedBy: acknowledged ? 'system_auto' : undefined,
      acknowledgedAt: acknowledgedAt?.toISOString(),
      resolved,
      resolvedBy: resolved ? '现场处置班组' : undefined,
      resolvedAt: resolvedAt?.toISOString(),
      resolution: resolved
        ? [
            '现场巡检确认误报，传感器表面清洁后恢复正常',
            '已紧固渗漏点法兰螺栓，压力测试合格，恢复生产',
            '调整加热炉燃烧参数，温度稳定在正常范围',
            '更换故障轴承，设备运行参数恢复正常',
          ][i % 4]
        : undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    safetyAlerts.push(alert);
  }

  return { safetySensors, safetyAlerts };
};
