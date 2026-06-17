import type {
  User,
  Block,
  Team,
  WellData,
  WorkOrder,
  WorkOrderType,
  WorkOrderStatus,
  WorkOrderPriority,
} from '../../shared/types.js';

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const orderTemplates: Array<{
  type: WorkOrderType;
  titles: string[];
  descriptions: string[];
}> = [
  {
    type: 'production',
    titles: [
      '日常采油生产巡检',
      '油井产量计量作业',
      '抽油机井工况调整',
      '电泵井电流监测',
      '注水井配注调整',
    ],
    descriptions: [
      '对井口装置、集输管线、计量设备进行日常巡回检查，确保生产运行平稳。',
      '采用容积法进行单井产量计量，记录油、气、水三相产量数据。',
      '根据功图数据调整抽油机冲次和冲程，优化抽油机工作参数。',
      '监测潜油电泵运行电流、电压、温度参数，分析机组运行状态。',
      '根据地质方案要求，调整注水井各层段配注量，确保水驱效果。',
    ],
  },
  {
    type: 'maintenance',
    titles: [
      '抽油机减速箱换油',
      '井口装置阀门更换',
      '输油管线清管作业',
      '加热炉燃烧器检修',
      '三相分离器内部清洗',
    ],
    descriptions: [
      '更换减速箱内齿轮油，清洗呼吸器，检查齿轮啮合情况。',
      '更换老化的井口闸阀，进行压力试验，确保无渗漏。',
      '发送清管球清除管线内结蜡和杂质，恢复管线输送能力。',
      '拆检燃烧器喷嘴，清理积碳，校验点火系统，调整风油比。',
      '打开分离器人孔，清除内部沉积物，检查防腐层状况。',
    ],
  },
  {
    type: 'inspection',
    titles: [
      '压力容器年度检验',
      '安全附件专项检查',
      '接地电阻季度测试',
      '防爆电气设备检查',
      '消防设施月度巡检',
    ],
    descriptions: [
      '按照压力容器检验规程，进行内外部宏观检查和壁厚测定。',
      '校验安全阀、压力表、液位计等安全附件的精度和可靠性。',
      '使用接地电阻测试仪测试设备接地装置，确保符合安全规范。',
      '检查防爆电气设备外壳、接线盒、密封件完整性，杜绝失爆。',
      '检查灭火器、消防栓、消防水带等消防器材，确保完好有效。',
    ],
  },
  {
    type: 'repair',
    titles: [
      '抽油机曲柄销故障处理',
      '输油泵机械密封更换',
      '注水泵柱塞拉伤修复',
      '仪表控制系统故障排查',
      '变压器油色谱异常处理',
    ],
    descriptions: [
      '曲柄销发出异响，需拆解检查轴承磨损情况，更换损坏部件。',
      '输油泵机械密封渗漏超标，停机更换动环、静环组件。',
      '注水泵柱塞表面出现拉伤沟槽，研磨修复或更换新柱塞。',
      'PLC系统I/O模块故障，排查通讯线路，更换损坏模块。',
      '变压器油色谱分析显示总烃超标，制定脱气处理方案。',
    ],
  },
];

const statuses: WorkOrderStatus[] = ['pending', 'pending', 'in_progress', 'in_progress', 'completed', 'completed', 'cancelled'];
const priorities: WorkOrderPriority[] = ['low', 'medium', 'medium', 'medium', 'high', 'urgent'];

export const generateMockWorkOrders = (
  wells: WellData[],
  blocks: Block[],
  teams: Team[],
  users: User[]
): WorkOrder[] => {
  const workOrders: WorkOrder[] = [];
  const teamLeaders = users.filter((u) => u.role === 'team_leader');
  const oilWorkers = users.filter((u) => u.role === 'oil_worker');

  const orderCount = 24;

  for (let i = 0; i < orderCount; i++) {
    const templateGroup = orderTemplates[i % orderTemplates.length];
    const type = templateGroup.type;
    const titleIdx = i % templateGroup.titles.length;
    const title = templateGroup.titles[titleIdx];
    const description = templateGroup.descriptions[titleIdx];

    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];

    const blockIdx = i % blocks.length;
    const block = blocks[blockIdx];
    const blockTeams = teams.filter((t) => t.blockId === block.id);
    const team = blockTeams[i % Math.max(blockTeams.length, 1)] || teams[i % teams.length];

    const blockWells = wells.filter((w) => w.blockId === block.id);
    const well = type === 'production' || type === 'maintenance'
      ? blockWells[i % Math.max(blockWells.length, 1)]
      : undefined;

    const assigneeIdx = i % Math.max(oilWorkers.length, 1);
    const assignerIdx = i % Math.max(teamLeaders.length, 1);
    const assignee = oilWorkers[assigneeIdx];
    const assigner = teamLeaders[assignerIdx];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (orderCount - i));
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 3 + (i % 4));
    const completedDate = status === 'completed'
      ? new Date(startDate)
      : undefined;
    if (completedDate) {
      completedDate.setDate(completedDate.getDate() + 1 + (i % 2));
    }

    const order: WorkOrder = {
      id: generateId(),
      code: `WO-${2026}${String(i + 1).padStart(4, '0')}`,
      title,
      description,
      type,
      status,
      priority,
      wellId: well?.id,
      blockId: block.id,
      teamId: team.id,
      assigneeId: assignee.id,
      assignerId: assigner.id,
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      completedDate: completedDate?.toISOString(),
      notes: priority === 'urgent' ? '请优先处理，影响生产运行' : i % 4 === 0 ? '需准备专用工具' : undefined,
      createdAt: startDate.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    workOrders.push(order);
  }

  return workOrders;
};
