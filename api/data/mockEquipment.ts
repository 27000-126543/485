import type {
  User,
  Block,
  Team,
  WellData,
  Equipment,
  EquipmentCategory,
  InspectionPlan,
  InspectionFrequency,
} from '../../shared/types.js';

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const equipmentConfigs: Array<{
  category: EquipmentCategory;
  names: string[];
  models: { model: string; manufacturer: string }[];
}> = [
  {
    category: 'pump',
    names: ['抽油泵', '输油泵', '注水泵', '离心泵', '柱塞泵'],
    models: [
      { model: 'CYB-70', manufacturer: '兰州水泵厂' },
      { model: '250Y-150', manufacturer: '沈阳水泵厂' },
      { model: 'KQSN300', manufacturer: '上海凯泉泵业' },
    ],
  },
  {
    category: 'compressor',
    names: ['天然气压缩机', '空气压缩机', '增压压缩机'],
    models: [
      { model: '2D12-100/8', manufacturer: '重庆压缩机厂' },
      { model: '4M20-250/12', manufacturer: '沈阳气体压缩机' },
      { model: 'VW-22/7', manufacturer: '红五环机械' },
    ],
  },
  {
    category: 'generator',
    names: ['柴油发电机组', '燃气发电机组', '备用电源机组'],
    models: [
      { model: '500GF', manufacturer: '康明斯发电设备' },
      { model: '300GFZ', manufacturer: '玉柴机器' },
      { model: '800GFC', manufacturer: '上柴动力' },
    ],
  },
  {
    category: 'separator',
    names: ['三相分离器', '油气分离器', '生产分离器'],
    models: [
      { model: 'FPS3000', manufacturer: '辽河石油装备' },
      { model: 'HNS-2400', manufacturer: '中国石油管道' },
      { model: 'YSF-1800', manufacturer: '宝石机械' },
    ],
  },
  {
    category: 'heater',
    names: ['原油加热炉', '水套加热炉', '真空加热炉'],
    models: [
      { model: 'YG-2000', manufacturer: '大庆油田装备' },
      { model: 'SZL6-1.25', manufacturer: '郑锅容器' },
      { model: 'ZWNS-1.4', manufacturer: '方快锅炉' },
    ],
  },
  {
    category: 'valve',
    names: ['井口闸阀', '节流截止阀', '安全阀', '球阀', '止回阀'],
    models: [
      { model: 'Z43Y-350', manufacturer: '苏州纽威阀门' },
      { model: 'J63Y-320', manufacturer: '上海开维喜' },
      { model: 'A42Y-160', manufacturer: '永一阀门集团' },
    ],
  },
  {
    category: 'motor',
    names: ['抽油机电机', '泵组驱动电机', '变频调速电机'],
    models: [
      { model: 'YKK450-4', manufacturer: '上海电机厂' },
      { model: 'YPT315M-4', manufacturer: '湘潭电机厂' },
      { model: 'YB3-280M-6', manufacturer: '南阳防爆集团' },
    ],
  },
  {
    category: 'other',
    names: ['计量装置', '自动控制系统', '水处理设备', '换热器', '脱硫装置'],
    models: [
      { model: 'JLQ-III', manufacturer: '西安石油仪器' },
      { model: 'SCADA-X1', manufacturer: '北京华夏科创' },
      { model: 'HRB-200', manufacturer: '兰石换热设备' },
    ],
  },
];

const checkItemTemplates: Record<EquipmentCategory, string[]> = {
  pump: [
    '检查泵体外观，有无渗漏、变形',
    '测量电机运行电流、电压是否正常',
    '检查轴承温度、振动值',
    '检查密封件渗漏情况',
    '核对进出口压力、流量参数',
    '检查联轴器对中情况',
    '检查润滑油脂液位、质量',
    '紧固连接螺栓',
  ],
  compressor: [
    '检查各级排气压力、温度',
    '检查润滑油油压、油位、油温',
    '检查气缸有无异常声响',
    '检查冷却系统运行状态',
    '检查气路系统有无渗漏',
    '校验安全阀动作灵敏可靠',
    '检查电机、电控柜温度',
    '检查振动值是否在允许范围',
  ],
  generator: [
    '检查蓄电池电压、电解液液位',
    '启动试运行，检查启动性能',
    '检查机油油位、冷却液液位',
    '空载运行检测三相电压平衡',
    '加载试验，检查频率稳定性',
    '检查冷却风扇、皮带张紧度',
    '检查排烟颜色是否正常',
    '检查控制器报警功能',
  ],
  separator: [
    '检查容器外观有无变形、腐蚀',
    '校验安全阀整定压力',
    '检查压力表、液位计指示准确',
    '检查进出口阀门开关灵活',
    '检测密封点有无渗漏',
    '检查自动排液装置功能',
    '检查接地装置连接可靠',
    '核对运行参数与设计值',
  ],
  heater: [
    '检查燃烧器点火、燃烧状况',
    '检查烟道通畅性、排烟温度',
    '检查炉体保温层完整性',
    '校验温控系统精度',
    '检查燃料供给管路渗漏',
    '检查循环水泵运行状态',
    '检查膨胀水箱液位',
    '检查安全联锁保护功能',
  ],
  valve: [
    '目视检查阀体外观，有无裂纹',
    '手动操作阀门开关灵活性',
    '检查填料函渗漏情况',
    '检查法兰连接螺栓紧固',
    '校验阀门行程指示器',
    '检查执行机构气源/电源',
    '检查阀门铭牌信息完整',
    '阀门试压（年度）',
  ],
  motor: [
    '测量电机绝缘电阻',
    '检查接线端子紧固、无氧化',
    '检查前后轴承温度、声音',
    '测量空载、负载电流值',
    '检查电机振动值',
    '检查冷却风扇、风罩完好',
    '检查机壳散热片清洁度',
    '检查接地线连接可靠',
  ],
  other: [
    '检查设备外观完整性',
    '检查各连接部位紧固情况',
    '检查显示仪表指示正常',
    '检查操作按钮、开关功能',
    '检查通讯数据上传正常',
    '检查报警功能正常触发',
    '清洁设备内外表面',
    '记录设备运行小时数',
  ],
};

const planTitles: Record<EquipmentCategory, string[]> = {
  pump: ['机泵月度预防性检查', '离心泵季度维护保养计划', '注水泵大修前状态评估'],
  compressor: ['压缩机旬度巡检计划', '往复压缩机月度维护', '空压机季度保养计划'],
  generator: ['柴油发电机周度试验', '备用电源月度检查', '发电机组季度保养'],
  separator: ['压力容器月度安全检查', '分离器季度维护计划', '三相分离器年度检验'],
  heater: ['加热炉月度安全检查', '燃烧器季度清洁保养', '锅炉年度能效测试'],
  valve: ['关键阀门季度巡检', '安全阀年度校验计划', '井口闸阀半年维护'],
  motor: ['电动机月度绝缘检测', '防爆电机季度专项检查', '变频电机年度性能测试'],
  other: ['自控系统日常巡检', '计量装置季度校准', '水处理设备月度检查'],
};

export const generateMockEquipmentData = (
  blocks: Block[],
  wells: WellData[],
  teams: Team[],
  users: User[]
): { equipment: Equipment[]; inspectionPlans: InspectionPlan[] } => {
  const equipment: Equipment[] = [];
  const inspectionPlans: InspectionPlan[] = [];

  const teamLeaders = users.filter((u) => u.role === 'team_leader');
  const oilWorkers = users.filter((u) => u.role === 'oil_worker');
  const assignees = [...teamLeaders, ...oilWorkers];

  const totalEquipment = 30;

  for (let i = 0; i < totalEquipment; i++) {
    const catIdx = i % equipmentConfigs.length;
    const config = equipmentConfigs[catIdx];
    const modelIdx = i % config.models.length;
    const modelInfo = config.models[modelIdx];
    const nameIdx = Math.floor(i / equipmentConfigs.length) % config.names.length;

    const blockIdx = i % blocks.length;
    const block = blocks[blockIdx];
    const blockWells = wells.filter((w) => w.blockId === block.id);
    const well = blockWells[i % Math.max(blockWells.length, 1)];
    const blockTeams = teams.filter((t) => t.blockId === block.id);
    const team = blockTeams[i % Math.max(blockTeams.length, 1)] || teams[i % teams.length];

    const statuses: Equipment['status'][] = ['operational', 'operational', 'operational', 'operational', 'standby', 'maintenance', 'faulty'];
    const status = statuses[i % statuses.length];

    const installDate = new Date();
    installDate.setFullYear(installDate.getFullYear() - (1 + (i % 6)));
    installDate.setMonth(i % 12);
    installDate.setDate((i % 27) + 1);

    const lastMaintenance = new Date(installDate);
    lastMaintenance.setMonth(lastMaintenance.getMonth() + (6 + (i % 8)));
    const nextMaintenance = new Date(lastMaintenance);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + (3 + (i % 6)));

    const runningHours = status === 'operational'
      ? (8000 + i * 200 + Math.random() * 5000)
      : status === 'standby'
      ? (2000 + Math.random() * 3000)
      : 1000 + Math.random() * 2000;

    const eq: Equipment = {
      id: generateId(),
      code: `EQP-${config.category.toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
      name: `${config.names[nameIdx]}#${i + 1}`,
      category: config.category,
      model: modelInfo.model,
      manufacturer: modelInfo.manufacturer,
      serialNumber: `${config.category.slice(0, 3).toUpperCase()}${2024 - (i % 5)}${String(100000 + i * 37).slice(0, 6)}`,
      wellId: (config.category === 'pump' || config.category === 'valve' || config.category === 'motor') && i % 3 !== 0
        ? well.id
        : undefined,
      blockId: block.id,
      teamId: team.id,
      installDate: installDate.toISOString(),
      lastMaintenanceDate: lastMaintenance.toISOString(),
      nextMaintenanceDate: nextMaintenance.toISOString(),
      status,
      runningHours: Math.round(runningHours * 100) / 100,
      faultCount: status === 'faulty' ? 3 + (i % 4) : i % 5,
      specifications: {
        额定功率: `${55 + (i % 10) * 37} kW`,
        额定电压: i % 2 === 0 ? '380V' : '6000V',
        设计压力: `${1.6 + (i % 5) * 0.8} MPa`,
        工作介质: i % 3 === 0 ? '原油' : i % 3 === 1 ? '天然气' : '清水',
      },
      notes: status === 'faulty' ? '故障待修，已提交报修工单' : i % 7 === 0 ? '备用设备' : undefined,
      createdAt: installDate.toISOString(),
    };

    equipment.push(eq);
  }

  const planCount = 15;

  for (let i = 0; i < planCount; i++) {
    const catIdx = i % equipmentConfigs.length;
    const config = equipmentConfigs[catIdx];
    const titles = planTitles[config.category];
    const title = titles[i % titles.length];

    const blockIdx = i % blocks.length;
    const block = blocks[blockIdx];

    const categoryEquipment = equipment.filter((e) => e.category === config.category && e.blockId === block.id);
    const targetEquip = categoryEquipment[i % Math.max(categoryEquipment.length, 1)];
    const targetWell = targetEquip?.wellId;

    const frequencies: InspectionFrequency[] = ['daily', 'weekly', 'monthly', 'monthly', 'quarterly', 'yearly'];
    const frequency = frequencies[i % frequencies.length];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (i * 5));

    const statuses: InspectionPlan['status'][] = ['active', 'active', 'active', 'active', 'inactive', 'completed'];
    const status = statuses[i % statuses.length];

    const lastDate = new Date(startDate);
    if (frequency === 'daily') lastDate.setDate(lastDate.getDate() + (i % 3));
    else if (frequency === 'weekly') lastDate.setDate(lastDate.getDate() + 7 + (i % 3));
    else if (frequency === 'monthly') lastDate.setMonth(lastDate.getMonth() + 1);
    else if (frequency === 'quarterly') lastDate.setMonth(lastDate.getMonth() + 3);
    else lastDate.setFullYear(lastDate.getFullYear() + 1);

    const nextDate = new Date(lastDate);
    if (frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);

    const plan: InspectionPlan = {
      id: generateId(),
      code: `IP-${String(i + 1).padStart(4, '0')}`,
      title,
      description: `针对${config.category}类设备按照${frequency === 'daily' ? '每日' : frequency === 'weekly' ? '每周' : frequency === 'monthly' ? '每月' : frequency === 'quarterly' ? '每季度' : '每年'}制度执行的标准检查计划，确保设备安全稳定运行。`,
      equipmentId: targetEquip?.id,
      wellId: targetWell,
      blockId: block.id,
      assigneeId: assignees[i % Math.max(assignees.length, 1)].id,
      frequency,
      status,
      checkItems: checkItemTemplates[config.category],
      startDate: startDate.toISOString(),
      endDate: status === 'completed' ? lastDate.toISOString() : undefined,
      lastInspectionDate: status !== 'inactive' ? lastDate.toISOString() : undefined,
      nextInspectionDate: status === 'active' ? nextDate.toISOString() : nextDate.toISOString(),
      notes: i % 4 === 0 ? '重点关注关键运行参数' : undefined,
      createdAt: startDate.toISOString(),
    };

    inspectionPlans.push(plan);
  }

  return { equipment, inspectionPlans };
};
