import { useState, useEffect } from 'react';
import {
  Wrench,
  Calendar,
  ListFilter,
  Upload,
  CheckCircle,
  Clock,
  AlertOctagon,
  Camera,
  Plus,
  ChevronRight,
  Filter,
  AlertTriangle,
  ArrowUp,
  FileText,
  X,
  Check,
} from 'lucide-react';
import DataTable, { type Column } from '@/components/DataTable';
import { useUserStore } from '@/store/userStore';
import http from '@/utils/request';
import type { EquipmentStatus, UserRole } from '@/types';

type EquipTab = 'calendar' | 'list' | 'repair';

interface InspectPlan {
  id: string;
  weekStart: string;
  dayOfWeek: number;
  timeSlot: string;
  title: string;
  equipmentName: string;
  assignee: string;
  team: string;
  status: 'scheduled' | 'completed';
  completedAt?: string;
  checklist: string[];
  completedItems: string[];
}

interface Equipment {
  id: string;
  code: string;
  name: string;
  type: string;
  blockName: string;
  location: string;
  status: EquipmentStatus;
  installDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  model: string;
  manufacturer: string;
  responsibleTeam: string;
}

interface RepairOrder {
  id: string;
  code: string;
  title: string;
  equipmentName: string;
  equipmentCode: string;
  type: 'mechanical' | 'electrical' | 'instrument' | 'hydraulic' | 'other';
  faultDescription: string;
  reporter: string;
  reportedAt: string;
  assignedTeam: string;
  assignee?: string;
  status: 'pending' | 'accepted' | 'processing' | 'completed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  acceptedAt?: string;
  completedAt?: string;
  escalatedAt?: string;
  resolution?: string;
  photoUrls?: string[];
}

const TEAM_MAP: Record<RepairOrder['type'], string> = {
  mechanical: '机修一班',
  electrical: '电修二班',
  instrument: '仪表班',
  hydraulic: '液压班',
  other: '综合班',
};

const TYPE_NAMES: Record<RepairOrder['type'], string> = {
  mechanical: '机械故障',
  electrical: '电气故障',
  instrument: '仪表故障',
  hydraulic: '液压故障',
  other: '其他故障',
};

const ESCALATE_HOURS = 2;

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function getWeekDates(base = new Date()) {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}

const mockPlans: InspectPlan[] = (() => {
  const dates = getWeekDates();
  const titles = [
    ['抽油泵日常巡检', '压力表校准', '阀门润滑保养'],
    ['电机绝缘检测', '控制柜除尘', '接线端子紧固'],
    ['流量计校验', '液位计检查', '温度变送器校准'],
    ['液压油检测', '密封件检查', '滤芯更换'],
  ];
  const data: InspectPlan[] = [];
  let id = 0;
  dates.forEach((date, dayIdx) => {
    titles.forEach((ts, grp) => {
      if ((dayIdx + grp) % 2 === 0) {
        ts.forEach((t, ti) => {
          id++;
          data.push({
            id: `IP${String(id).padStart(3, '0')}`,
            weekStart: dates[0].toISOString(),
            dayOfWeek: dayIdx,
            timeSlot: ['08:00-10:00', '10:30-12:30', '14:00-16:00'][ti],
            title: t,
            equipmentName: `设备-${String.fromCharCode(65 + grp)}${ti + 1}`,
            assignee: ['王巡检', '李巡检', '张巡检', '赵巡检'][(id - 1) % 4],
            team: `巡检${['甲', '乙', '丙', '丁'][grp]}班`,
            status: dayIdx < 3 || (dayIdx === 3 && ti === 0) ? 'completed' : 'scheduled',
            completedAt: dayIdx < 3 ? dates[dayIdx].toISOString() : undefined,
            checklist: ['外观检查', '运行参数记录', '异音异响排查', '清洁保养'],
            completedItems: dayIdx < 3 ? ['外观检查', '运行参数记录', '异音异响排查', '清洁保养'] : [],
          });
        });
      }
    });
  });
  return data;
})();

const mockEquip: Equipment[] = [
  { id: 'E001', code: 'SB-B-001', name: '1#抽油泵机组', type: '抽油泵', blockName: 'A区', location: 'A-01井场', status: 'normal', installDate: '2024-03-15', lastMaintenance: '2026-05-20', nextMaintenance: '2026-06-20', model: 'CYJ10-3-53HB', manufacturer: '中石化石油机械', responsibleTeam: '机修一班' },
  { id: 'E002', code: 'SB-B-002', name: '2#抽油泵机组', type: '抽油泵', blockName: 'A区', location: 'A-02井场', status: 'maintenance', installDate: '2024-03-20', lastMaintenance: '2026-06-10', nextMaintenance: '2026-07-10', model: 'CYJ10-3-53HB', manufacturer: '中石化石油机械', responsibleTeam: '机修一班' },
  { id: 'E003', code: 'SB-D-003', name: '3#注水泵', type: '注水泵', blockName: 'B区', location: 'B区注水站', status: 'normal', installDate: '2023-11-08', lastMaintenance: '2026-05-28', nextMaintenance: '2026-06-28', model: '3DP-40', manufacturer: '长庆石油设备', responsibleTeam: '机修二班' },
  { id: 'E004', code: 'SB-K-004', name: '1#空气压缩机', type: '压缩机', blockName: 'B区', location: 'B区动力站', status: 'fault', installDate: '2023-05-12', lastMaintenance: '2026-04-15', nextMaintenance: '2026-06-15', model: 'LU30-8', manufacturer: '阿特拉斯科普柯', responsibleTeam: '电修二班' },
  { id: 'E005', code: 'SB-F-005', name: '原油外输泵', type: '外输泵', blockName: 'C区', location: 'C区转油站', status: 'normal', installDate: '2024-08-22', lastMaintenance: '2026-06-01', nextMaintenance: '2026-07-01', model: '250YHCB-30', manufacturer: '沈阳水泵', responsibleTeam: '机修一班' },
  { id: 'E006', code: 'SB-Y-006', name: '变压器T-01', type: '变压器', blockName: 'C区', location: 'C区变电站', status: 'normal', installDate: '2022-10-30', lastMaintenance: '2026-03-10', nextMaintenance: '2026-09-10', model: 'S11-2500/35', manufacturer: '特变电工', responsibleTeam: '电修一班' },
  { id: 'E007', code: 'SB-Y-007', name: 'DCS控制系统', type: '控制系统', blockName: 'D区', location: 'D区中控室', status: 'normal', installDate: '2024-01-18', lastMaintenance: '2026-05-05', nextMaintenance: '2026-08-05', model: 'SUPCON ECS-700', manufacturer: '中控技术', responsibleTeam: '仪表班' },
  { id: 'E008', code: 'SB-B-008', name: '加热炉HL-02', type: '加热炉', blockName: 'D区', location: 'D区接转站', status: 'scrapped', installDate: '2018-06-01', lastMaintenance: '2025-12-01', nextMaintenance: '-', model: 'YYQL-1500', manufacturer: '雄越热能', responsibleTeam: '机修二班' },
];

const mockRepairs: RepairOrder[] = [
  {
    id: 'R001', code: 'BX-20260617-001', title: '1#空压机异响', equipmentName: '1#空气压缩机', equipmentCode: 'SB-K-004', type: 'mechanical',
    faultDescription: '运行中曲轴箱有明显金属敲击声，振动超标，已紧急停机。', reporter: '李运行', reportedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    assignedTeam: TEAM_MAP.mechanical, status: 'pending', priority: 'urgent',
  },
  {
    id: 'R002', code: 'BX-20260617-002', title: '流量变送器漂移', equipmentName: '原油外输流量计', equipmentCode: 'FL-C-023', type: 'instrument',
    faultDescription: '外输流量与储罐液位偏差超过5%，怀疑仪表漂移需校准。', reporter: '王储运', reportedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    assignedTeam: TEAM_MAP.instrument, status: 'pending', priority: 'high',
  },
  {
    id: 'R003', code: 'BX-20260616-008', title: 'C区变电站跳闸', equipmentName: '变压器T-01', equipmentCode: 'SB-Y-006', type: 'electrical',
    faultDescription: '凌晨3:22差动保护动作跳闸，已强送成功，需检测。', reporter: '孙值班', reportedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    assignedTeam: TEAM_MAP.electrical, status: 'processing', priority: 'high', assignee: '陈电修', acceptedAt: new Date(Date.now() - 17 * 3600000).toISOString(),
  },
  {
    id: 'R004', code: 'BX-20260616-005', title: '液压站油压低', equipmentName: 'BOP控制液站', equipmentCode: 'HY-B-012', type: 'hydraulic',
    faultDescription: '系统压力只能达到14MPa，额定21MPa，可能存在内漏。', reporter: '张司钻', reportedAt: new Date(Date.now() - 32 * 3600000).toISOString(),
    assignedTeam: TEAM_MAP.hydraulic, status: 'escalated', priority: 'medium', assignee: '周液压', acceptedAt: new Date(Date.now() - 31 * 3600000).toISOString(), escalatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'R005', code: 'BX-20260615-012', title: '阀门填料更换', equipmentName: '集油干线阀', equipmentCode: 'VL-A-108', type: 'mechanical',
    faultDescription: '阀门盘根渗漏，更换密封填料。', reporter: '赵采油', reportedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    assignedTeam: TEAM_MAP.mechanical, status: 'completed', priority: 'medium', assignee: '吴机修', acceptedAt: new Date(Date.now() - 47 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 42 * 3600000).toISOString(), resolution: '已更换石墨盘根4圈，试运2小时无渗漏。', photoUrls: ['现场照片1', '密封对比'],
  },
];

const equipStatusStyles: Record<EquipmentStatus, { bg: string; text: string; border: string; label: string; dot: string }> = {
  normal: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '正常', dot: 'bg-oil-green' },
  maintenance: { bg: 'bg-oil-cyan/20', text: 'text-oil-cyan', border: 'border-oil-cyan/50', label: '维护中', dot: 'bg-oil-cyan' },
  fault: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '故障', dot: 'bg-oil-red' },
  scrapped: { bg: 'bg-oil-text-muted/20', text: 'text-oil-text-muted', border: 'border-oil-text-muted/50', label: '报废', dot: 'bg-oil-text-muted' },
};

const repairStatusStyles: Record<RepairOrder['status'], { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
  pending: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '待接单', icon: <Clock size={12} /> },
  accepted: { bg: 'bg-oil-cyan/20', text: 'text-oil-cyan', border: 'border-oil-cyan/50', label: '已接单', icon: <CheckCircle size={12} /> },
  processing: { bg: 'bg-oil-accent/20', text: 'text-oil-accent', border: 'border-oil-accent/50', label: '处理中', icon: <Wrench size={12} /> },
  escalated: { bg: 'bg-oil-purple/20', text: 'text-oil-purple', border: 'border-oil-purple/50', label: '已升级', icon: <ArrowUp size={12} /> },
  completed: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '已完成', icon: <CheckCircle size={12} /> },
};

const priorityStyles = {
  low: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '低' },
  medium: { bg: 'bg-oil-cyan/20', text: 'text-oil-cyan', border: 'border-oil-cyan/50', label: '中' },
  high: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '高' },
  urgent: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '紧急' },
};

export default function Equipment() {
  const { user } = useUserStore();
  const [tab, setTab] = useState<EquipTab>('calendar');
  const [plans, setPlans] = useState<InspectPlan[]>(mockPlans);
  const [equipList] = useState<Equipment[]>(mockEquip);
  const [statusFilter, setStatusFilter] = useState<'all' | EquipmentStatus>('all' as const);
  const [repairs, setRepairs] = useState<RepairOrder[]>(mockRepairs);
  const [selectedPlan, setSelectedPlan] = useState<InspectPlan | null>(null);
  const [completeModal, setCompleteModal] = useState<RepairOrder | null>(null);
  const [resolution, setResolution] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [weekDates] = useState(() => getWeekDates());
  const [, force] = useState(0);

  useEffect(() => {
    try { http.get('/equipment/repairs'); } catch {}
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setRepairs(prev => prev.map(r => {
        if (r.status === 'accepted' && r.acceptedAt) {
          const diff = Date.now() - new Date(r.acceptedAt).getTime();
          if (diff > ESCALATE_HOURS * 3600000 && !r.escalatedAt) {
            return { ...r, status: 'escalated', escalatedAt: new Date().toISOString() };
          }
        }
        return r;
      }));
      force(n => n + 1);
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const canAcceptRepair = (r: RepairOrder) => {
    if (!user) return false;
    if (r.status !== 'pending') return false;
    return ['hq_admin', 'maintenance_engineer', 'oil_worker', 'team_leader', 'block_manager'].includes(user.role as string);
  };

  const canCompleteRepair = (r: RepairOrder) => {
    if (!user) return false;
    if (r.status !== 'accepted' && r.status !== 'processing' && r.status !== 'escalated') return false;
    return ['hq_admin', 'maintenance_engineer', 'team_leader', 'block_manager'].includes(user.role as string);
  };

  const filteredEquip = statusFilter === 'all' ? equipList : equipList.filter(e => e.status === statusFilter);

  const tabs: { key: EquipTab; label: string; icon: React.ReactNode }[] = [
    { key: 'calendar', label: '巡检日历', icon: <Calendar size={18} /> },
    { key: 'list', label: '设备列表', icon: <ListFilter size={18} /> },
    { key: 'repair', label: '报修工单', icon: <Wrench size={18} /> },
  ];

  const handleCheckIn = (planId: string, items: string[]) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: 'completed', completedAt: new Date().toISOString(), completedItems: items } : p));
    setSelectedPlan(null);
  };

  const handleCompleteRepair = () => {
    if (!completeModal) return;
    setRepairs(prev => prev.map(r => r.id === completeModal.id ? { ...r, status: 'completed', completedAt: new Date().toISOString(), resolution, photoUrls } : r));
    setCompleteModal(null);
    setResolution('');
    setPhotoUrls([]);
  };

  const handlePhotoUpload = () => {
    const sampleUrl = `https://picsum.photos/seed/${Date.now()}/200/150`;
    setPhotoUrls(prev => [...prev, sampleUrl]);
  };

  const equipColumns: Column<Equipment>[] = [
    { key: 'code', title: '设备编号', width: '110px' },
    { key: 'name', title: '设备名称', width: '160px', render: r => <span className="text-white font-medium">{r.name}</span> },
    { key: 'type', title: '类型', width: '90px', render: r => <span className="px-2 py-0.5 rounded bg-oil-purple/15 text-oil-purple text-xs border border-oil-purple/30">{r.type}</span> },
    { key: 'blockName', title: '区块', width: '60px' },
    { key: 'location', title: '位置', width: '120px' },
    { key: 'status', title: '状态', width: '90px', render: r => { const s = equipStatusStyles[r.status]; return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${r.status === 'normal' ? 'animate-pulse-slow' : ''}`} />{s.label}</span>; } },
    { key: 'lastMaintenance', title: '上次保养', width: '110px' },
    { key: 'nextMaintenance', title: '下次保养', width: '110px', render: r => { const due = new Date(r.nextMaintenance); const diff = (due.getTime() - Date.now()) / 86400000; return <span className={diff < 7 ? 'text-oil-red font-semibold' : diff < 15 ? 'text-oil-yellow' : 'text-white'}>{r.nextMaintenance}</span>; } },
    { key: 'action', title: '操作', width: '80px', align: 'center', render: () => <button className="px-2 py-1 rounded text-xs border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 transition-all flex items-center gap-1 mx-auto"><ChevronRight size={12} /> 详情</button> },
  ];

  const repairColumns: Column<RepairOrder>[] = [
    { key: 'code', title: '工单号', width: '140px' },
    { key: 'title', title: '标题', width: '170px', render: r => <span className="text-white">{r.title}</span> },
    { key: 'type', title: '类型', width: '80px', render: r => <span className="px-2 py-0.5 rounded bg-oil-accent/15 text-oil-accent text-xs border border-oil-accent/30">{TYPE_NAMES[r.type]}</span> },
    { key: 'priority', title: '优先级', width: '70px', render: r => { const s = priorityStyles[r.priority]; return <span className={`px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>; } },
    { key: 'assignedTeam', title: '处理班组', width: '90px' },
    { key: 'status', title: '状态', width: '90px', render: r => { const s = repairStatusStyles[r.status]; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{s.icon}{s.label}</span>; } },
    { key: 'reporter', title: '报修人', width: '80px' },
    { key: 'reportedAt', title: '报修时间', width: '150px', render: r => new Date(r.reportedAt).toLocaleString('zh-CN') },
    { key: 'action', title: '操作', width: '200px', align: 'center', render: r => (
      <div className="flex items-center justify-center gap-2">
        {canAcceptRepair(r) && (
          <button onClick={() => setRepairs(prev => prev.map(x => x.id === r.id ? { ...x, status: 'accepted', assignee: user?.name, acceptedAt: new Date().toISOString() } : x))} className="px-3 py-1 rounded text-xs bg-oil-cyan/20 text-oil-cyan border border-oil-cyan/50 hover:bg-oil-cyan/30 hover:shadow-glow-cyan transition-all flex items-center gap-1">
            <CheckCircle size={12} /> 接单
          </button>
        )}
        {canCompleteRepair(r) && (
          <button onClick={() => { setCompleteModal(r); setResolution(r.resolution || ''); setPhotoUrls(r.photoUrls || []); }} className="px-3 py-1 rounded text-xs bg-oil-green/20 text-oil-green border border-oil-green/50 hover:bg-oil-green/30 hover:shadow-glow-green transition-all flex items-center gap-1">
            <Check size={12} /> 完成
          </button>
        )}
        <button className="px-2 py-1 rounded text-xs border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 transition-all">
          <FileText size={12} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">设备运维</h2>
        <p className="text-oil-text-muted">巡检计划 · 设备台账 · 报修工单 · 升级机制</p>
      </div>

      <div className="bg-oil-panel rounded-xl border border-oil-accent/20 p-1.5 inline-flex gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === t.key ? 'bg-oil-accent text-white shadow-glow-blue' : 'text-oil-text-muted hover:text-white hover:bg-oil-panel-light'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && (
        <div className="space-y-4">
          <div className="bg-oil-panel rounded-xl border border-oil-green/20 p-5 shadow-glow-green">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="text-oil-green" size={20} /> 本周巡检计划 <span className="text-xs text-oil-text-muted font-normal ml-2">{weekDates[0].toLocaleDateString('zh-CN')} ~ {weekDates[6].toLocaleDateString('zh-CN')}</span>
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-oil-green/70" /><span className="text-oil-text-muted">已完成</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-oil-accent/70" /><span className="text-oil-text-muted">待执行</span></div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {weekDates.map((date, dayIdx) => {
                const dayPlans = plans.filter(p => p.dayOfWeek === dayIdx);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div key={dayIdx} className={`rounded-xl border p-3 min-h-[260px] ${isToday ? 'bg-oil-accent/5 border-oil-accent/60 shadow-glow-blue' : 'bg-oil-panel-light/50 border-oil-accent/20'}`}>
                    <div className="mb-3 pb-2 border-b border-oil-accent/10 flex items-center justify-between">
                      <div>
                        <div className={`text-sm font-semibold ${isToday ? 'text-oil-accent' : 'text-white'}`}>{WEEK_DAYS[dayIdx]}</div>
                        <div className="text-xs text-oil-text-muted">{date.getMonth() + 1}/{date.getDate()}</div>
                      </div>
                      {isToday && <span className="text-[10px] px-1.5 py-0.5 rounded bg-oil-accent/20 text-oil-accent border border-oil-accent/50">今日</span>}
                    </div>
                    <div className="space-y-2">
                      {dayPlans.map(p => (
                        <button key={p.id} onClick={() => setSelectedPlan(p)} className={`w-full text-left rounded-lg border p-2.5 transition-all hover:scale-[1.02] ${p.status === 'completed' ? 'bg-oil-green/10 border-oil-green/40' : 'bg-oil-panel border-oil-accent/30 hover:border-oil-accent/60'}`}>
                          <div className="flex items-start justify-between mb-1">
                            <span className={`text-xs font-medium ${p.status === 'completed' ? 'text-oil-green' : 'text-white'}`}>{p.title}</span>
                            {p.status === 'completed' && <CheckCircle size={12} className="text-oil-green flex-shrink-0" />}
                          </div>
                          <div className="text-[10px] text-oil-text-muted mb-1 flex items-center gap-1"><Clock size={9} />{p.timeSlot}</div>
                          <div className="text-[10px] text-oil-text-muted">{p.equipmentName} · {p.assignee}</div>
                          {p.status !== 'completed' && isToday && (
                            <button onClick={e => { e.stopPropagation(); handleCheckIn(p.id, p.checklist); }} className="mt-2 w-full px-2 py-1 rounded bg-oil-accent/20 text-oil-accent border border-oil-accent/50 hover:bg-oil-accent/30 transition-all text-[10px] font-medium flex items-center justify-center gap-1">
                              <Check size={9} /> 一键打卡
                            </button>
                          )}
                        </button>
                      ))}
                      {dayPlans.length === 0 && (
                        <div className="text-center text-xs text-oil-text-muted py-8">无计划</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedPlan && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setSelectedPlan(null)}>
              <div className="bg-oil-panel border border-oil-accent/40 rounded-2xl shadow-glow-blue w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-oil-accent/20 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="text-oil-accent" size={18} /> 巡检详情</h3>
                  <button onClick={() => setSelectedPlan(null)} className="text-oil-text-muted hover:text-white"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-white mb-2">{selectedPlan.title}</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-oil-text-muted">设备：</span><span className="text-white">{selectedPlan.equipmentName}</span></div>
                      <div><span className="text-oil-text-muted">时间：</span><span className="text-white">{selectedPlan.timeSlot}</span></div>
                      <div><span className="text-oil-text-muted">人员：</span><span className="text-white">{selectedPlan.assignee}</span></div>
                      <div><span className="text-oil-text-muted">班组：</span><span className="text-white">{selectedPlan.team}</span></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-white mb-2">检查清单 <span className="text-oil-text-muted text-xs">（{selectedPlan.completedItems.length}/{selectedPlan.checklist.length}）</span></div>
                    <div className="space-y-2">
                      {selectedPlan.checklist.map(item => {
                        const done = selectedPlan.completedItems.includes(item);
                        return (
                          <label key={item} className="flex items-center gap-2 p-2 rounded bg-oil-panel-light border border-oil-accent/20 cursor-pointer hover:border-oil-accent/40 transition-all text-sm">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done ? 'bg-oil-green border-oil-green' : 'border-oil-text-muted/50'}`}>{done && <Check size={10} className="text-white" />}</div>
                            <span className={done ? 'text-oil-green line-through' : 'text-white'}>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-oil-accent/20 flex justify-end gap-3">
                  <button onClick={() => setSelectedPlan(null)} className="px-4 py-2 rounded-lg border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 text-sm">关闭</button>
                  {selectedPlan.status !== 'completed' && (
                    <button onClick={() => handleCheckIn(selectedPlan.id, selectedPlan.checklist)} className="px-4 py-2 rounded-lg bg-oil-green text-white hover:shadow-glow-green text-sm flex items-center gap-1.5"><Check size={14} /> 完成打卡</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'list' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            {(['all', ...Object.keys(equipStatusStyles)]).map(_k => {
              const k = _k as EquipmentStatus | 'all';
              const s = _k === 'all' ? { bg: 'bg-oil-accent/20', text: 'text-oil-accent', label: '全部' } : equipStatusStyles[_k as EquipmentStatus];
              const count = _k === 'all' ? equipList.length : equipList.filter(e => e.status === _k as EquipmentStatus).length;
              const active = statusFilter === k;
              return (
                <button key={_k} onClick={() => setStatusFilter(k)} className={`bg-oil-panel rounded-xl border p-5 transition-all ${active ? 'scale-[1.02]' : ''} ${_k === 'all' ? 'border-oil-accent/40' : equipStatusStyles[_k as EquipmentStatus].border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${s.bg} ${s.text} ${_k === 'all' ? 'border-oil-accent/50' : equipStatusStyles[_k as EquipmentStatus].border}`}>{s.label}</span>
                  </div>
                  <div className={`text-3xl font-bold ${s.text}`}>{count}</div>
                  <div className="text-sm text-oil-text-muted mt-1">设备数</div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Filter size={14} className="text-oil-text-muted" />
            <div className="flex gap-1 bg-oil-panel-light rounded-lg p-1">
              {(['all', 'normal', 'maintenance', 'fault', 'scrapped'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s as any)} className={`px-3 py-1 rounded text-xs transition-all ${statusFilter === s ? 'bg-oil-accent text-white shadow-glow-blue' : 'text-oil-text-muted hover:text-white'}`}>
                  {s === 'all' ? '全部' : equipStatusStyles[s as EquipmentStatus].label}
                </button>
              ))}
            </div>
          </div>
          <DataTable<Equipment> columns={equipColumns} data={filteredEquip} title="设备台账列表" rowKey="id" pageSize={8} searchPlaceholder="搜索设备编号/名称/位置..." searchKeys={['code', 'name', 'type', 'location']} />
        </div>
      )}

      {tab === 'repair' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
            {(Object.keys(repairStatusStyles) as RepairOrder['status'][]).map(k => {
              const s = repairStatusStyles[k];
              const ct = repairs.filter(r => r.status === k).length;
              return (
                <div key={k} className={`bg-oil-panel rounded-xl border ${s.border} p-4 transition-all`}>
                  <div className="flex items-center justify-between mb-2"><span className={`text-xs px-2 py-0.5 rounded border ${s.bg} ${s.text} ${s.border}`}>{s.icon}{s.label}</span></div>
                  <div className={`text-2xl font-bold ${s.text}`}>{ct}</div>
                </div>
              );
            })}
          </div>
          <div className="mb-3 text-xs text-oil-text-muted flex items-center gap-1.5">
            <AlertOctagon size={12} className="text-oil-purple" /> 提示：工单接单后超过 <span className="text-oil-purple font-semibold">{ESCALATE_HOURS}小时</span> 未完成将自动升级
          </div>
          <DataTable<RepairOrder> columns={repairColumns} data={repairs} title="报修工单" rowKey="id" pageSize={8} searchPlaceholder="搜索工单/设备..." searchKeys={['code', 'title', 'equipmentName']} />

          {completeModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setCompleteModal(null)}>
              <div className="bg-oil-panel border border-oil-accent/40 rounded-2xl shadow-glow-blue w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-oil-accent/20 bg-oil-green/10">
                  <h3 className="text-lg font-bold text-oil-green flex items-center gap-2"><CheckCircle size={20} /> 工单完成 - {completeModal.code}</h3>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><div className="text-oil-text-muted text-xs mb-1">设备</div><div className="text-white">{completeModal.equipmentName}</div></div>
                    <div><div className="text-oil-text-muted text-xs mb-1">处理班组</div><div className="text-white">{completeModal.assignedTeam}</div></div>
                  </div>
                  <div>
                    <label className="block text-sm text-oil-text-muted mb-2">处理说明<span className="text-oil-red"> *</span></label>
                    <textarea rows={3} value={resolution} onChange={e => setResolution(e.target.value)} placeholder="请详细填写故障原因、处理过程和结果..." className="w-full px-4 py-3 bg-oil-panel-light border border-oil-accent/30 rounded-lg text-white placeholder:text-oil-text-muted focus:outline-none focus:border-oil-accent focus:shadow-glow-blue resize-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-oil-text-muted mb-2 flex items-center gap-1.5"><Camera size={14} /> 现场照片 <span className="text-oil-text-muted font-normal text-xs">（模拟上传）</span></label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {photoUrls.map((url, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-oil-accent/30 group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-oil-red/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                        </div>
                      ))}
                      <button onClick={handlePhotoUpload} className="w-24 h-24 rounded-lg border-2 border-dashed border-oil-accent/40 hover:border-oil-accent hover:bg-oil-accent/10 transition-all flex flex-col items-center justify-center gap-1 text-oil-text-muted hover:text-oil-accent">
                        <Upload size={20} />
                        <span className="text-xs">添加照片</span>
                      </button>
                    </div>
                    {photoUrls.length > 0 && <div className="text-xs text-oil-green">已上传 {photoUrls.length} 张照片（URL模式模拟）</div>}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-oil-accent/20 flex justify-end gap-3">
                  <button onClick={() => setCompleteModal(null)} className="px-5 py-2 rounded-lg border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 text-sm">取消</button>
                  <button onClick={handleCompleteRepair} disabled={!resolution.trim()} className="px-5 py-2 rounded-lg bg-oil-green text-white hover:shadow-glow-green text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"><Check size={14} /> 确认完成</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
