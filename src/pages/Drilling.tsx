import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Package,
  FileCheck,
  GripVertical,
  AlertTriangle,
  ShoppingCart,
  Check,
  X,
  Clock,
  Plus,
  ChevronRight,
  Truck,
} from 'lucide-react';
import DataTable, { type Column } from '@/components/DataTable';
import { useUserStore } from '@/store/userStore';
import http from '@/utils/request';

type DrillingTab = 'gantt' | 'inventory' | 'purchase';

interface GanttTask {
  id: string;
  rigName: string;
  blockName: string;
  tasks: { name: string; start: number; duration: number; color: string }[];
}

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  stock: number;
  safetyStock: number;
  reserved: number;
  location: string;
  lastUpdated: string;
}

interface PurchaseOrder {
  id: string;
  code: string;
  title: string;
  items: string;
  amount: number;
  createdBy: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  currentApprover: string;
  urgency: 'low' | 'medium' | 'high';
  deadline?: string;
}

const mockTasks: GanttTask[] = [
  {
    id: 'R001', rigName: 'ZJ70DB-01号钻机', blockName: 'A区',
    tasks: [
      { name: '钻前准备', start: 0, duration: 3, color: 'bg-oil-cyan' },
      { name: '一开钻进', start: 3, duration: 6, color: 'bg-oil-accent' },
      { name: '下套管固井', start: 9, duration: 2, color: 'bg-oil-green' },
      { name: '二开钻进', start: 11, duration: 8, color: 'bg-oil-accent' },
      { name: '测井', start: 19, duration: 2, color: 'bg-oil-purple' },
    ],
  },
  {
    id: 'R002', rigName: 'ZJ50DB-02号钻机', blockName: 'B区',
    tasks: [
      { name: '钻前准备', start: 2, duration: 3, color: 'bg-oil-cyan' },
      { name: '一开钻进', start: 5, duration: 5, color: 'bg-oil-accent' },
      { name: '下套管固井', start: 10, duration: 2, color: 'bg-oil-green' },
      { name: '二开钻进', start: 12, duration: 10, color: 'bg-oil-accent' },
      { name: '完井测试', start: 22, duration: 3, color: 'bg-oil-yellow' },
    ],
  },
  {
    id: 'R003', rigName: 'ZJ70DB-03号钻机', blockName: 'C区',
    tasks: [
      { name: '搬迁安装', start: 0, duration: 4, color: 'bg-oil-purple' },
      { name: '钻前准备', start: 4, duration: 2, color: 'bg-oil-cyan' },
      { name: '一开钻进', start: 6, duration: 7, color: 'bg-oil-accent' },
      { name: '下套管', start: 13, duration: 2, color: 'bg-oil-green' },
      { name: '二开钻进', start: 15, duration: 10, color: 'bg-oil-accent' },
    ],
  },
  {
    id: 'R004', rigName: 'ZJ40DB-04号钻机', blockName: 'D区',
    tasks: [
      { name: '检修保养', start: 0, duration: 5, color: 'bg-oil-yellow' },
      { name: '搬迁安装', start: 5, duration: 4, color: 'bg-oil-purple' },
      { name: '钻前准备', start: 9, duration: 3, color: 'bg-oil-cyan' },
      { name: '一开钻进', start: 12, duration: 6, color: 'bg-oil-accent' },
    ],
  },
  {
    id: 'R005', rigName: 'ZJ50DB-05号钻机', blockName: 'A区',
    tasks: [
      { name: '三开钻进', start: 0, duration: 8, color: 'bg-oil-accent' },
      { name: '取芯作业', start: 8, duration: 4, color: 'bg-oil-purple' },
      { name: '测井', start: 12, duration: 2, color: 'bg-oil-purple' },
      { name: '下套管', start: 14, duration: 3, color: 'bg-oil-green' },
      { name: '固井候凝', start: 17, duration: 2, color: 'bg-oil-yellow' },
    ],
  },
];

const mockInventory: InventoryItem[] = [
  { id: 'I001', name: '钻头PDC 215.9mm', code: 'BIT-PDC-215', category: '钻井工具', unit: '只', stock: 8, safetyStock: 10, reserved: 2, location: 'A区仓库-01-03', lastUpdated: '2026-06-17 08:15' },
  { id: 'I002', name: '钻杆 5寸 S135', code: 'DP-5-S135', category: '钻具', unit: '根', stock: 186, safetyStock: 150, reserved: 45, location: 'B区仓库-02-11', lastUpdated: '2026-06-17 09:30' },
  { id: 'I003', name: '套管 9-5/8寸 N80', code: 'CSG-958-N80', category: '油套管', unit: '根', stock: 42, safetyStock: 80, reserved: 12, location: '中心库-套管区-05', lastUpdated: '2026-06-16 18:45' },
  { id: 'I004', name: '钻井液重晶石粉', code: 'MUD-BAR-001', category: '钻井液材料', unit: '吨', stock: 58, safetyStock: 40, reserved: 15, location: '中心库-散料区-02', lastUpdated: '2026-06-17 07:20' },
  { id: 'I005', name: '油层保护剂', code: 'MUD-PRO-003', category: '钻井液材料', unit: '吨', stock: 5, safetyStock: 15, reserved: 0, location: 'C区仓库-03-07', lastUpdated: '2026-06-15 14:10' },
  { id: 'I006', name: '扶正器 216mm', code: 'STB-216-01', category: '钻井工具', unit: '个', stock: 64, safetyStock: 30, reserved: 18, location: 'A区仓库-01-08', lastUpdated: '2026-06-17 10:05' },
  { id: 'I007', name: '钻井泵活塞 140mm', code: 'PMP-PIS-140', category: '配件', unit: '件', stock: 12, safetyStock: 20, reserved: 8, location: '中心库-配件区-12', lastUpdated: '2026-06-16 16:30' },
  { id: 'I008', name: '安全接头 5寸', code: 'SAF-JNT-5', category: '钻井工具', unit: '个', stock: 16, safetyStock: 10, reserved: 3, location: 'D区仓库-04-02', lastUpdated: '2026-06-17 06:50' },
];

const mockPurchase: PurchaseOrder[] = [
  { id: 'PO001', code: 'CG-20260617-001', title: 'A区钻井项目套管采购', items: '套管×80根, 钻头×15只', amount: 1258000, createdBy: '王钻井', createdAt: '2026-06-17 09:20', status: 'pending', currentApprover: '物供经理', urgency: 'high', deadline: new Date(Date.now() + 3 * 3600000).toISOString() },
  { id: 'PO002', code: 'CG-20260616-008', title: '钻井液材料补充', items: '重晶石×30吨, 保护剂×12吨', amount: 186500, createdBy: '李工程师', createdAt: '2026-06-16 14:35', status: 'processing', currentApprover: '总工程师', urgency: 'medium', deadline: new Date(Date.now() + 28 * 3600000).toISOString() },
  { id: 'PO003', code: 'CG-20260616-005', title: '钻井泵配件采购', items: '活塞×30件, 阀组×10套', amount: 92800, createdBy: '张队长', createdAt: '2026-06-16 10:12', status: 'approved', currentApprover: '-', urgency: 'low' },
  { id: 'PO004', code: 'CG-20260615-012', title: 'B区钻具补充', items: '钻杆×60根, 扶正器×20个', amount: 586000, createdBy: '赵调度', createdAt: '2026-06-15 16:40', status: 'completed', currentApprover: '-', urgency: 'medium' },
  { id: 'PO005', code: 'CG-20260614-003', title: 'C区应急物资', items: '各种应急物资一批', amount: 45200, createdBy: '孙安全员', createdAt: '2026-06-14 11:25', status: 'rejected', currentApprover: '-', urgency: 'high' },
];

const TOTAL_DAYS = 28;

const urgencyStyles = {
  low: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '普通' },
  medium: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '紧急' },
  high: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '特急' },
};

const statusStyles: Record<PurchaseOrder['status'], { bg: string; text: string; border: string; label: string }> = {
  pending: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '待审批' },
  processing: { bg: 'bg-oil-cyan/20', text: 'text-oil-cyan', border: 'border-oil-cyan/50', label: '审批中' },
  approved: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '已通过' },
  rejected: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '已驳回' },
  completed: { bg: 'bg-oil-accent/20', text: 'text-oil-accent', border: 'border-oil-accent/50', label: '已完成' },
};

export default function Drilling() {
  const { user } = useUserStore();
  const [tab, setTab] = useState<DrillingTab>('gantt');
  const [ganttTasks] = useState<GanttTask[]>(mockTasks);
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [purchase, setPurchase] = useState<PurchaseOrder[]>(mockPurchase);
  const [draggedTask, setDraggedTask] = useState<{ rigId: string; taskIndex: number } | null>(null);

  const fetchData = async () => {
    try {
      const [inv, po] = await Promise.all([
        http.get<InventoryItem[]>('/drilling/inventory'),
        http.get<PurchaseOrder[]>('/drilling/purchase'),
      ]);
      if (inv?.length) setInventory(inv);
      if (po?.length) setPurchase(po);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const canApprovePurchase = user && ['hq_admin', 'drilling_engineer', 'supply_manager', 'block_manager', 'chief_engineer'].includes(user.role);

  const invColumns: Column<InventoryItem>[] = [
    { key: 'code', title: '物料编码', width: '140px', sortable: true },
    { key: 'name', title: '物料名称', width: '180px', sortable: true },
    { key: 'category', title: '分类', width: '110px', render: r => <span className="px-2 py-0.5 rounded bg-oil-accent/15 text-oil-accent text-xs">{r.category}</span> },
    { key: 'stock', title: '库存', align: 'right', sortable: true, render: r => (
      <div className="flex items-center justify-end gap-2">
        <span className={`font-semibold ${r.stock < r.safetyStock ? 'text-oil-red' : 'text-white'}`}>{r.stock}</span>
        <span className="text-oil-text-muted">{r.unit}</span>
      </div>
    )},
    { key: 'safetyStock', title: '安全线', align: 'right', width: '90px', render: r => <span className="text-oil-text-muted">{r.safetyStock}</span> },
    { key: 'reserved', title: '已预留', align: 'right', width: '90px', render: r => <span className="text-oil-yellow">{r.reserved}</span> },
    { key: 'location', title: '库位', width: '160px' },
    { key: 'lastUpdated', title: '更新时间', width: '140px' },
    { key: 'action', title: '操作', width: '140px', align: 'center', render: r => (
      <div className="flex items-center justify-center gap-2">
        {r.stock < r.safetyStock && (
          <button onClick={() => alert(`已生成采购申请：${r.name}`)} className="px-3 py-1 rounded text-xs bg-oil-red/20 text-oil-red border border-oil-red/50 hover:bg-oil-red/30 hover:shadow-glow-red transition-all flex items-center gap-1">
            <ShoppingCart size={12} /> 采购
          </button>
        )}
      </div>
    )},
  ];

  const purchaseColumns: Column<PurchaseOrder>[] = [
    { key: 'code', title: '申请编号', width: '150px', sortable: true },
    { key: 'title', title: '申请标题', width: '200px' },
    { key: 'urgency', title: '紧急度', width: '90px', render: r => { const s = urgencyStyles[r.urgency]; return <span className={`px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>; } },
    { key: 'amount', title: '金额(元)', width: '120px', align: 'right', sortable: true, render: r => <span className="text-white font-medium">¥{r.amount.toLocaleString()}</span> },
    { key: 'createdBy', title: '申请人', width: '90px' },
    { key: 'createdAt', title: '申请时间', width: '150px' },
    { key: 'status', title: '状态', width: '100px', render: r => { const s = statusStyles[r.status]; return <span className={`px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>; } },
    { key: 'currentApprover', title: '当前节点', width: '100px' },
    { key: 'action', title: '操作', width: '200px', align: 'center', render: r => {
      const isApprovalStage = r.status === 'pending' || r.status === 'processing';
      return (
        <div className="flex items-center justify-center gap-2">
          {isApprovalStage && canApprovePurchase ? (
            <>
              <button onClick={() => setPurchase(prev => prev.map(p => p.id === r.id ? { ...p, status: 'approved' } : p))} className="px-3 py-1 rounded text-xs bg-oil-green/20 text-oil-green border border-oil-green/50 hover:bg-oil-green/30 hover:shadow-glow-green transition-all flex items-center gap-1">
                <Check size={12} /> 通过
              </button>
              <button onClick={() => setPurchase(prev => prev.map(p => p.id === r.id ? { ...p, status: 'rejected' } : p))} className="px-3 py-1 rounded text-xs bg-oil-red/20 text-oil-red border border-oil-red/50 hover:bg-oil-red/30 hover:shadow-glow-red transition-all flex items-center gap-1">
                <X size={12} /> 驳回
              </button>
            </>
          ) : (
            <button className="px-3 py-1 rounded text-xs border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 transition-all flex items-center gap-1">
              <ChevronRight size={12} /> 详情
            </button>
          )}
        </div>
      );
    }},
  ];

  const tabs: { key: DrillingTab; label: string; icon: React.ReactNode; glow: string }[] = [
    { key: 'gantt', label: '排程甘特图', icon: <CalendarDays size={18} />, glow: 'shadow-glow-blue' },
    { key: 'inventory', label: '库存看板', icon: <Package size={18} />, glow: 'shadow-glow-cyan' },
    { key: 'purchase', label: '采购审批', icon: <FileCheck size={18} />, glow: 'shadow-glow-green' },
  ];

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">钻井调度</h2>
        <p className="text-oil-text-muted">钻井排程管理 · 物料库存 · 采购审批流程</p>
      </div>

      <div className="bg-oil-panel rounded-xl border border-oil-accent/20 p-1.5 inline-flex gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t.key
                ? `bg-oil-accent text-white ${t.glow}`
                : 'text-oil-text-muted hover:text-white hover:bg-oil-panel-light'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'gantt' && (
        <div className="bg-oil-panel rounded-xl border border-oil-accent/20 p-5 shadow-glow-blue overflow-x-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <CalendarDays className="text-oil-accent" size={20} /> 钻井作业排程
            </h3>
            <div className="flex gap-4 text-xs">
              {[
                { color: 'bg-oil-cyan', label: '准备' },
                { color: 'bg-oil-accent', label: '钻进' },
                { color: 'bg-oil-green', label: '固井' },
                { color: 'bg-oil-purple', label: '测井/安装' },
                { color: 'bg-oil-yellow', label: '其他' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${l.color}`} />
                  <span className="text-oil-text-muted">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-[1100px]">
            <div className="flex border-b border-oil-accent/30 mb-3">
              <div className="w-64 flex-shrink-0 px-4 py-2 text-xs font-semibold text-oil-text-muted border-r border-oil-accent/20">
                钻机 / 任务
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: TOTAL_DAYS }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const weekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={i} className={`flex-1 text-center text-xs py-2 border-r border-oil-accent/10 ${weekend ? 'bg-oil-panel-light/40' : ''}`}>
                      <div className="text-oil-text-muted">{d.getMonth() + 1}/{d.getDate()}</div>
                      <div className={`${i === 0 ? 'text-oil-accent font-bold' : 'text-oil-text-muted/60'}`}>{['日', '一', '二', '三', '四', '五', '六'][d.getDay()]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {ganttTasks.map(rig => (
              <div key={rig.id} className="border-b border-oil-accent/10 group">
                <div className="flex">
                  <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-oil-accent/20 flex items-center gap-2 group-hover:bg-oil-panel-light/30 transition-colors">
                    <GripVertical size={14} className="text-oil-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div>
                      <div className="text-sm text-white font-medium">{rig.rigName}</div>
                      <div className="text-xs text-oil-text-muted">{rig.blockName}</div>
                    </div>
                  </div>
                  <div className="flex-1 relative py-3 h-16">
                    {rig.tasks.map((task, ti) => (
                      <div
                        key={ti}
                        draggable
                        onDragStart={() => setDraggedTask({ rigId: rig.id, taskIndex: ti })}
                        onDragEnd={() => setDraggedTask(null)}
                        className={`absolute h-6 rounded-md ${task.color} flex items-center px-2 text-xs text-white font-medium shadow-md cursor-move hover:brightness-110 hover:scale-y-110 transition-all overflow-hidden`}
                        style={{
                          left: `${(task.start / TOTAL_DAYS) * 100}%`,
                          width: `calc(${(task.duration / TOTAL_DAYS) * 100}% - 4px)`,
                          top: ti % 2 === 0 ? '8px' : '36px',
                        }}
                        title={`${task.name} (${task.duration}天)`}
                      >
                        <span className="truncate">{task.name}</span>
                        <span className="ml-auto opacity-80 flex-shrink-0">{task.duration}d</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-oil-accent/20 flex items-center gap-3 text-xs text-oil-text-muted">
            <Clock size={12} className="text-oil-accent" />
            <span>任务条可拖动示意 · 共 {ganttTasks.length} 台钻机运行中 · 本周计划任务 {ganttTasks.reduce((s, r) => s + r.tasks.length, 0)} 项</span>
          </div>
        </div>
      )}

      {tab === 'inventory' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            {[
              { label: '物料总数', value: inventory.length, color: 'blue', icon: <Package size={22} /> },
              { label: '低于安全线', value: inventory.filter(i => i.stock < i.safetyStock).length, color: 'red', icon: <AlertTriangle size={22} /> },
              { label: '总库存价值', value: '¥2,856万', color: 'green', icon: <Truck size={22} /> },
              { label: '待入库', value: 18, color: 'yellow', icon: <Plus size={22} /> },
            ].map(s => (
              <div key={s.label} className={`bg-oil-panel rounded-xl border border-oil-${s.color}/30 p-5 shadow-glow-${s.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-oil-${s.color}`}>{s.icon}</span>
                </div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-oil-text-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <DataTable<InventoryItem>
            columns={invColumns}
            data={inventory}
            title="物料库存明细"
            rowKey="id"
            pageSize={10}
            searchPlaceholder="搜索物料编码/名称..."
            searchKeys={['code', 'name', 'category']}
          />
        </div>
      )}

      {tab === 'purchase' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
            {(Object.keys(statusStyles) as PurchaseOrder['status'][]).map(k => {
              const s = statusStyles[k];
              return (
                <button key={k} className={`bg-oil-panel rounded-xl border ${s.border} p-4 transition-all hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${s.text}`}>{purchase.filter(p => p.status === k).length}</div>
                  <div className="text-xs text-oil-text-muted mt-1">申请数</div>
                </button>
              );
            })}
          </div>
          <DataTable<PurchaseOrder>
            columns={purchaseColumns}
            data={purchase}
            title="采购申请单列表"
            rowKey="id"
            pageSize={8}
            searchPlaceholder="搜索编号/标题..."
            searchKeys={['code', 'title', 'items']}
          />
        </div>
      )}
    </div>
  );
}
