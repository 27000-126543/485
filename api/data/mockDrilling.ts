import type {
  User,
  Block,
  WellData,
  DrillingProposal,
  DrillingRig,
  MaterialStock,
  PurchaseRequest,
} from '../../shared/types.js';

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const proposalStatuses: DrillingProposal['status'][] = [
  'draft',
  'submitted',
  'reviewing',
  'approved',
  'approved',
  'in_progress',
  'completed',
  'rejected',
];

const proposalTitles = [
  '东胜区块13号井钻井方案',
  '东胜区块14号井勘探钻井',
  '西北区块扩边井钻井工程',
  '西北区块加密井钻井计划',
  '华北油区深层水平井方案',
  '华北油区老井侧钻方案',
  '南部勘探区预探井方案',
  '南部勘探区评价井钻井',
];

const geologicalAssessments = [
  '该区域位于主力油层发育带，地震资料显示构造完整，砂体厚度25-35米，孔隙度18%-22%，渗透率50-120mD，预计单井日产油65吨。',
  '构造位置有利，储层物性较好，油层厚度20-28米，含油饱和度68%，预计产能良好。',
  '砂体展布稳定，连通性好，邻井生产数据显示该层位产能稳定，建议部署开发井。',
  '通过三维地震解释识别出有利圈闭，面积约3.5平方公里，资源量估算120万吨，建议尽快实施。',
  '目的层埋深3800-4200米，储层特征表现为低孔低渗，需采用体积压裂技术，预计单井无阻流量80方/天。',
  '老井复查显示剩余油富集区位于构造高部位，侧钻靶点设计合理，投资回收期预计18个月。',
  '预探井部署在新区块，存在一定勘探风险，但资源潜力大，建议兼探上下两套层系。',
  '评价井位于圈闭主体部位，旨在落实油藏规模，为后续开发方案编制提供依据。',
];

const rigModels = [
  { model: 'ZJ70DB', manufacturer: '宝鸡石油机械', maxDepth: 7000, crewSize: 45, powerRating: 2200 },
  { model: 'ZJ50DB', manufacturer: '兰州石油机械', maxDepth: 5000, crewSize: 38, powerRating: 1800 },
  { model: 'ZJ40DB', manufacturer: '南阳石油机械厂', maxDepth: 4000, crewSize: 32, powerRating: 1470 },
  { model: 'ZJ30DB', manufacturer: '江汉四机厂', maxDepth: 3000, crewSize: 28, powerRating: 1100 },
  { model: 'ZJ90DB', manufacturer: '宝石机械', maxDepth: 9000, crewSize: 52, powerRating: 3000 },
];

const materialConfigs: Array<{
  name: string;
  category: MaterialStock['category'];
  unit: string;
  unitPrice: number;
  supplier: string;
}> = [
  { name: '钻井级重晶石粉', category: 'drilling', unit: '吨', unitPrice: 3200, supplier: '湖北新洋丰矿业' },
  { name: '钠基膨润土', category: 'drilling', unit: '吨', unitPrice: 850, supplier: '建平慧营化工' },
  { name: '羧甲基纤维素CMC', category: 'chemical', unit: '吨', unitPrice: 18500, supplier: '北方化学工业' },
  { name: '聚丙烯酰胺PAM', category: 'chemical', unit: '吨', unitPrice: 22000, supplier: '中石化炼化工程' },
  { name: 'G级油井水泥', category: 'production', unit: '吨', unitPrice: 1280, supplier: '海螺水泥' },
  { name: '油管接箍', category: 'production', unit: '件', unitPrice: 680, supplier: '天津钢管集团' },
  { name: '抽油杆Φ22mm', category: 'production', unit: '米', unitPrice: 85, supplier: '大庆油田装备' },
  { name: '液压油L-HM46', category: 'maintenance', unit: '桶', unitPrice: 2850, supplier: '中国石油润滑油' },
  { name: '防喷器组密封件', category: 'safety', unit: '套', unitPrice: 15800, supplier: '华北荣盛机械' },
  { name: '正压式呼吸器气瓶', category: 'safety', unit: '只', unitPrice: 3600, supplier: '梅思安安全设备' },
];

const purchaseTitles = [
  '东胜区块钻井液材料采购申请',
  '西北区块固井水泥采购计划',
  '生产设备润滑油脂批量采购',
  '安全防护用品季度采购',
  '钻井配件应急采购申请',
];

export const generateMockDrillingData = (
  blocks: Block[],
  users: User[],
  wells: WellData[]
): {
  drillingProposals: DrillingProposal[];
  drillingRigs: DrillingRig[];
  materialStocks: MaterialStock[];
  purchaseRequests: PurchaseRequest[];
} => {
  const geologists = users.filter((u) => u.role === 'geologist');
  const chiefEngineers = users.filter((u) => u.role === 'chief_engineer');
  const supplyManagers = users.filter((u) => u.role === 'supply_manager');

  const drillingProposals: DrillingProposal[] = [];
  const materialStocks: MaterialStock[] = [];
  const purchaseRequests: PurchaseRequest[] = [];

  materialConfigs.forEach((config, index) => {
    const minStock = 50 + Math.floor(Math.random() * 150);
    const maxStock = minStock * 4 + Math.floor(Math.random() * 200);
    const currentStock = Math.floor(minStock + Math.random() * (maxStock - minStock));

    const material: MaterialStock = {
      id: generateId(),
      code: `MAT-${String(index + 1).padStart(4, '0')}`,
      name: config.name,
      category: config.category,
      unit: config.unit,
      currentStock,
      minStock,
      maxStock,
      unitPrice: config.unitPrice,
      supplier: config.supplier,
      warehouse: index % 2 === 0 ? '中心仓库A区' : '北库B区',
      lastRestockDate: `2026-0${(index % 5) + 1}-${String((index % 27) + 1).padStart(2, '0')}T08:00:00.000Z`,
      specifications: {
        质量标准: index % 2 === 0 ? 'GB/T 5005-2010' : 'SY/T 5364-2006',
        包装方式: index % 2 === 0 ? '吨袋包装' : '铁桶密封',
        存储条件: '通风干燥，避免阳光直射',
      },
      createdAt: `2024-0${(index % 9) + 1}-10T08:00:00.000Z`,
      updatedAt: new Date().toISOString(),
    };

    materialStocks.push(material);
  });

  proposalTitles.forEach((title, index) => {
    const block = blocks[index % blocks.length];
    const status = proposalStatuses[index];
    const targetDepth = 2500 + Math.random() * 4500;
    const estimatedCost = 8000000 + Math.random() * 25000000;
    const estimatedDuration = 45 + Math.floor(Math.random() * 120);

    const materialRequirements = materialStocks
      .slice(0, 4)
      .map((mat) => ({
        materialId: mat.id,
        quantity: Math.floor(10 + Math.random() * 200),
      }));

    const startDate = status === 'in_progress' || status === 'completed'
      ? `2026-0${(index % 4) + 1}-15T08:00:00.000Z`
      : undefined;
    const completionDate = status === 'completed'
      ? `2026-0${(index % 4) + 3}-20T16:00:00.000Z`
      : undefined;

    const createdAt = `2025-1${(index % 2) + 1}-${String((index % 27) + 1).padStart(2, '0')}T08:00:00.000Z`;
    const deadline = new Date(new Date(createdAt).getTime() + 48 * 60 * 60 * 1000).toISOString();

    const geologistApproval = status === 'draft' || status === 'submitted'
      ? { status: 'pending' as const }
      : status === 'rejected'
      ? { status: 'rejected' as const, approverId: geologists[index % geologists.length].id, rejectedAt: new Date().toISOString() }
      : { status: 'approved' as const, approverId: geologists[index % geologists.length].id, approvedAt: new Date().toISOString() };

    const chiefEngineerApproval = status === 'approved' || status === 'in_progress' || status === 'completed'
      ? { status: 'approved' as const, approverId: chiefEngineers[0].id, approvedAt: new Date().toISOString() }
      : status === 'rejected'
      ? { status: 'rejected' as const, approverId: chiefEngineers[0].id, rejectedAt: new Date().toISOString() }
      : { status: 'pending' as const };

    const proposal: DrillingProposal = {
      id: generateId(),
      code: `DP-${2026}${String(index + 1).padStart(3, '0')}`,
      title,
      blockId: block.id,
      proposedBy: geologists[index % geologists.length].id,
      reviewedBy: status !== 'draft' && status !== 'submitted'
        ? chiefEngineers[0].id
        : undefined,
      approvedBy: status === 'approved' || status === 'in_progress' || status === 'completed'
        ? chiefEngineers[0].id
        : undefined,
      status,
      targetDepth: Math.round(targetDepth * 100) / 100,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      estimatedDuration,
      geologicalAssessment: geologicalAssessments[index],
      equipmentRequirements: [
        'ZJ70DB钻机1套',
        '泥浆循环系统1套',
        '固控系统1套',
        '井控装置1套',
        '测井设备1套',
      ],
      materialRequirements,
      startDate,
      completionDate,
      deadline,
      escalated: false,
      geologistApproval,
      chiefEngineerApproval,
      notes: index % 3 === 0 ? '需协调完井作业队提前进场' : undefined,
      createdAt,
      updatedAt: new Date().toISOString(),
    };

    drillingProposals.push(proposal);
  });

  const drillingRigs: DrillingRig[] = rigModels.map((config, index) => {
    const status: DrillingRig['status'] =
      index === 0 ? 'deployed' :
      index === 1 ? 'deployed' :
      index === 2 ? 'available' :
      index === 3 ? 'maintenance' :
      'available';

    const deployedProposal = status === 'deployed'
      ? drillingProposals.find((p) => p.status === 'in_progress')
      : undefined;

    return {
      id: generateId(),
      code: `RIG-${String(index + 1).padStart(2, '0')}`,
      name: `${config.manufacturer.slice(0, 4)}${index + 1}号钻机`,
      model: config.model,
      manufacturer: config.manufacturer,
      maxDepth: config.maxDepth,
      currentDepth: status === 'deployed' ? 1500 + Math.random() * 3000 : undefined,
      blockId: deployedProposal?.blockId,
      proposalId: deployedProposal?.id,
      status,
      crewSize: config.crewSize,
      powerRating: config.powerRating,
      lastMaintenanceDate: `2026-0${(index % 4) + 1}-${String((index % 27) + 1).padStart(2, '0')}T08:00:00.000Z`,
      nextMaintenanceDate: `2026-0${(index % 4) + 5}-${String((index % 27) + 1).padStart(2, '0')}T08:00:00.000Z`,
      totalDrillingHours: Math.round((5000 + Math.random() * 15000) * 100) / 100,
      specifications: {
        传动方式: 'AC变频驱动',
        提升系统: '绞车+游车大钩',
        循环系统: '泥浆泵×3',
        井架高度: index === 4 ? '52米' : '45米',
      },
      createdAt: `2023-0${index + 1}-${String((index % 27) + 1).padStart(2, '0')}T08:00:00.000Z`,
    };
  });

  purchaseTitles.forEach((title, index) => {
    const items = materialStocks
      .slice(index * 2, index * 2 + 3)
      .map((mat) => ({
        materialId: mat.id,
        materialName: mat.name,
        quantity: Math.floor(20 + Math.random() * 150),
        unitPrice: mat.unitPrice,
      }));

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const statuses: PurchaseRequest['status'][] = ['draft', 'submitted', 'approved', 'ordered', 'received'];
    const status = statuses[index % statuses.length];
    const urgency: PurchaseRequest['urgency'] = index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low';

    const request: PurchaseRequest = {
      id: generateId(),
      code: `PR-${2026}${String(index + 1).padStart(4, '0')}`,
      title,
      requestedBy: supplyManagers[0].id,
      approvedBy: status !== 'draft' && status !== 'submitted' ? users[0].id : undefined,
      department: ['钻井工程部', '生产运行部', '设备管理部', '安全环保部', '物资供应中心'][index],
      status,
      totalAmount: Math.round(totalAmount * 100) / 100,
      items,
      urgency,
      expectedDeliveryDate: `2026-0${(index % 5) + 2}-${String((index % 27) + 1).padStart(2, '0')}T08:00:00.000Z`,
      actualDeliveryDate: status === 'received'
        ? `2026-0${(index % 5) + 1}-${String((index % 27) + 1).padStart(2, '0')}T14:30:00.000Z`
        : undefined,
      notes: urgency === 'high' ? '现场急需，催办处理' : undefined,
      createdAt: `2026-0${(index % 4) + 1}-${String((index % 27) + 1).padStart(2, '0')}T08:00:00.000Z`,
      updatedAt: new Date().toISOString(),
    };

    purchaseRequests.push(request);
  });

  return { drillingProposals, drillingRigs, materialStocks, purchaseRequests };
};
