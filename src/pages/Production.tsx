import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Droplets,
  Thermometer,
  AlertTriangle,
  Clock,
  CheckCircle,
  PlayCircle,
  ArrowUp,
  AlertOctagon,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import DataTable, { type Column } from '@/components/DataTable';
import { useUserStore } from '@/store/userStore';
import http from '@/utils/request';
import type { WellStatus } from '@/types';

interface Well {
  id: string;
  name: string;
  blockName: string;
  teamName: string;
  status: WellStatus;
  oilPressure: number;
  temperature: number;
  dailyProduction: number;
  cumulativeProduction: number;
  integrityRate: number;
  lastMaintenance: string;
  responsible: string;
}

interface WorkOrder {
  id: string;
  code: string;
  title: string;
  wellName: string;
  type: 'production' | 'equipment' | 'safety';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'escalated';
  createdAt: string;
  deadline?: string;
  confirmedAt?: string;
  escalatedAt?: string;
  completedAt?: string;
  assignee: string;
  description: string;
}

interface TrendPoint {
  time: string;
  pressure: number;
  temperature: number;
}

const mockWells: Well[] = [
  { id: 'W001', name: 'A-01井', blockName: 'A区', teamName: '采油一队', status: 'running', oilPressure: 8.6, temperature: 62.4, dailyProduction: 42.6, cumulativeProduction: 58260, integrityRate: 98.5, lastMaintenance: '2026-06-10', responsible: '张班长' },
  { id: 'W002', name: 'A-02井', blockName: 'A区', teamName: '采油一队', status: 'running', oilPressure: 7.2, temperature: 58.1, dailyProduction: 35.2, cumulativeProduction: 52180, integrityRate: 96.2, lastMaintenance: '2026-06-08', responsible: '李师傅' },
  { id: 'W003', name: 'A-03井', blockName: 'A区', teamName: '采油一队', status: 'fault', oilPressure: 2.1, temperature: 75.8, dailyProduction: 12.8, cumulativeProduction: 48920, integrityRate: 85.3, lastMaintenance: '2026-05-28', responsible: '王师傅' },
  { id: 'W004', name: 'B-01井', blockName: 'B区', teamName: '采油二队', status: 'running', oilPressure: 6.8, temperature: 55.2, dailyProduction: 38.4, cumulativeProduction: 61250, integrityRate: 97.8, lastMaintenance: '2026-06-12', responsible: '赵班长' },
  { id: 'W005', name: 'B-02井', blockName: 'B区', teamName: '采油二队', status: 'stopped', oilPressure: 0, temperature: 28.6, dailyProduction: 0, cumulativeProduction: 45860, integrityRate: 94.5, lastMaintenance: '2026-06-15', responsible: '钱师傅' },
  { id: 'W006', name: 'C-01井', blockName: 'C区', teamName: '采油三队', status: 'running', oilPressure: 9.5, temperature: 67.8, dailyProduction: 52.1, cumulativeProduction: 65480, integrityRate: 97.2, lastMaintenance: '2026-06-05', responsible: '孙班长' },
  { id: 'W007', name: 'C-02井', blockName: 'C区', teamName: '采油三队', status: 'running', oilPressure: 7.9, temperature: 59.6, dailyProduction: 39.8, cumulativeProduction: 54360, integrityRate: 96.8, lastMaintenance: '2026-06-14', responsible: '周师傅' },
  { id: 'W008', name: 'D-01井', blockName: 'D区', teamName: '采油四队', status: 'fault', oilPressure: 1.5, temperature: 72.3, dailyProduction: 8.5, cumulativeProduction: 42180, integrityRate: 82.6, lastMaintenance: '2026-05-20', responsible: '吴师傅' },
];

const initialTrend: TrendPoint[] = Array.from({ length: 30 }, (_, i) => ({
  time: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
  pressure: 7.5 + Math.sin(i * 0.5) * 1.5 + (Math.random() - 0.5) * 0.8,
  temperature: 58 + Math.sin(i * 0.4) * 6 + (Math.random() - 0.5) * 3,
}));

const makeInitialOrders = (): WorkOrder[] => [
  {
    id: 'WO001', code: 'GD-20260617-001', title: 'A-03井温度异常处理', wellName: 'A-03井', type: 'production', priority: 'urgent',
    status: 'pending', createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    deadline: new Date(Date.now() - 3 * 60000).toISOString(),
    assignee: '王师傅', description: '井口温度持续高于75℃，油压下降明显，需现场检查并处理。',
  },
  {
    id: 'WO002', code: 'GD-20260617-002', title: 'D-01井故障紧急维修', wellName: 'D-01井', type: 'equipment', priority: 'urgent',
    status: 'escalated', createdAt: new Date(Date.now() - 32 * 60000).toISOString(),
    escalatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    assignee: '设备组-陈工', description: 'D-01井抽油泵卡泵，已停井等待维修，预计影响日产量10吨。',
  },
  {
    id: 'WO003', code: 'GD-20260617-003', title: 'C-01井例行巡检', wellName: 'C-01井', type: 'production', priority: 'medium',
    status: 'confirmed', createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    confirmedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    assignee: '孙班长', description: '检查各仪表运行状态，录取油压、套压、回压数据。',
  },
  {
    id: 'WO004', code: 'GD-20260616-008', title: 'B-02井计划性维护', wellName: 'B-02井', type: 'equipment', priority: 'low',
    status: 'processing', createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    confirmedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    assignee: '钱师傅', description: '更换密封圈及压力表，预计停井2小时。',
  },
  {
    id: 'WO005', code: 'GD-20260616-005', title: 'B-01井生产参数优化', wellName: 'B-01井', type: 'production', priority: 'high',
    status: 'completed', createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    confirmedAt: new Date(Date.now() - 23 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    assignee: '赵班长', description: '根据邻井数据调整冲次和冲程，优化产量。',
  },
  {
    id: 'WO006', code: 'GD-20260615-012', title: 'A区管线压力波动排查', wellName: 'A区', type: 'safety', priority: 'medium',
    status: 'pending', createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    deadline: new Date(Date.now() + 30 * 60000).toISOString(),
    assignee: '张班长', description: 'A区集输干线压力波动超过±10%，需逐井排查。',
  },
];

const statusStyles: Record<WellStatus, { bg: string; text: string; border: string; label: string; dot: string }> = {
  running: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '运行中', dot: 'bg-oil-green' },
  stopped: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '已停井', dot: 'bg-oil-yellow' },
  fault: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '故障', dot: 'bg-oil-red' },
};

const woPriorityStyles = {
  low: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '普通' },
  medium: { bg: 'bg-oil-cyan/20', text: 'text-oil-cyan', border: 'border-oil-cyan/50', label: '一般' },
  high: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '重要' },
  urgent: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '紧急' },
};

const woStatusStyles = {
  pending: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '待接单', icon: <Clock size={12} /> },
  confirmed: { bg: 'bg-oil-cyan/20', text: 'text-oil-cyan', border: 'border-oil-cyan/50', label: '已接单', icon: <PlayCircle size={12} /> },
  processing: { bg: 'bg-oil-accent/20', text: 'text-oil-accent', border: 'border-oil-accent/50', label: '处理中', icon: <RotateCcw size={12} /> },
  escalated: { bg: 'bg-oil-purple/20', text: 'text-oil-purple', border: 'border-oil-purple/50', label: '已升级', icon: <ArrowUp size={12} /> },
  completed: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '已完成', icon: <CheckCheck size={12} /> },
};

const ESCALATE_MINUTES = 15;

export default function Production() {
  const { user } = useUserStore();
  const [wells] = useState<Well[]>(mockWells);
  const [selectedWellId, setSelectedWellId] = useState<string>(mockWells[0].id);
  const [trend, setTrend] = useState<TrendPoint[]>(initialTrend);
  const [orders, setOrders] = useState<WorkOrder[]>(makeInitialOrders);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    try {
      http.get('/production/wells').then((d: any) => { if (d?.length) {} });
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrend(prev => {
        const now = new Date();
        const newPoint: TrendPoint = {
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          pressure: 7.5 + Math.sin(Date.now() * 0.0001) * 1.5 + (Math.random() - 0.5) * 0.8,
          temperature: 58 + Math.sin(Date.now() * 0.00008) * 6 + (Math.random() - 0.5) * 3,
        };
        return [...prev.slice(1), newPoint];
      });
      setOrders(prev => prev.map(o => {
        if ((o.status === 'pending') && o.deadline) {
          const diff = Date.now() - new Date(o.deadline).getTime();
          if (diff > 0) {
            return { ...o, status: 'escalated' as WorkOrder['status'], escalatedAt: new Date().toISOString() };
          }
        }
        return o;
      }));
      forceUpdate(n => n + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const selectedWell = wells.find(w => w.id === selectedWellId) || wells[0];

  const getOrderCountdown = (o: WorkOrder) => {
    if (o.status !== 'pending' || !o.deadline) return null;
    const remain = new Date(o.deadline).getTime() - Date.now();
    const abs = Math.abs(remain);
    const m = Math.floor(abs / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    return { overdue: remain <= 0, text: `${m}:${String(s).padStart(2, '0')}` };
  };

  const wellColumns: Column<Well>[] = [
    { key: 'name', title: '井口', width: '100px', sortable: true, render: r => <span className="text-white font-medium">{r.name}</span> },
    { key: 'blockName', title: '区块', width: '70px' },
    { key: 'status', title: '状态', width: '90px', render: r => {
      const s = statusStyles[r.status];
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${r.status === 'running' ? 'animate-pulse-slow' : ''}`} />
          {s.label}
        </span>
      );
    }},
    { key: 'oilPressure', title: '油压(MPa)', align: 'right', width: '100px', sortable: true, render: r => (
      <span className={`font-semibold ${r.status === 'fault' || r.oilPressure < 3 ? 'text-oil-red' : 'text-white'}`}>{r.oilPressure.toFixed(1)}</span>
    )},
    { key: 'temperature', title: '温度(℃)', align: 'right', width: '90px', sortable: true, render: r => (
      <span className={`font-semibold ${r.temperature > 65 ? 'text-oil-red' : 'text-white'}`}>{r.temperature.toFixed(1)}</span>
    )},
    { key: 'dailyProduction', title: '日产量(吨)', align: 'right', width: '100px', sortable: true, render: r => <span className="text-white">{r.dailyProduction.toFixed(1)}</span> },
    { key: 'integrityRate', title: '完好率', align: 'right', width: '90px', render: r => (
      <span className={r.integrityRate >= 95 ? 'text-oil-green' : r.integrityRate >= 90 ? 'text-oil-yellow' : 'text-oil-red'}>{r.integrityRate.toFixed(1)}%</span>
    )},
    { key: 'responsible', title: '责任人', width: '90px' },
  ];

  const trendOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(17,34,64,0.95)', borderColor: '#3B82F6', textStyle: { color: '#CBD5E1' } },
    legend: { data: ['油压(MPa)', '温度(℃)'], textStyle: { color: '#64748B' }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: trend.map(t => t.time), axisLine: { lineStyle: { color: '#3B82F640' } }, axisLabel: { color: '#CBD5E1', fontSize: 10 } },
    yAxis: [
      { type: 'value', name: 'MPa', position: 'left', axisLine: { lineStyle: { color: '#3B82F640' } }, axisLabel: { color: '#64748B' }, splitLine: { lineStyle: { color: '#3B82F620' } }, nameTextStyle: { color: '#64748B' } },
      { type: 'value', name: '℃', position: 'right', axisLine: { lineStyle: { color: '#06B6D440' } }, axisLabel: { color: '#64748B' }, splitLine: { show: false }, nameTextStyle: { color: '#64748B' } },
    ],
    series: [
      {
        name: '油压(MPa)', type: 'line', smooth: true, data: trend.map(t => +t.pressure.toFixed(2)),
        itemStyle: { color: '#3B82F6' }, lineStyle: { width: 2, color: '#3B82F6' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.35)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } },
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { color: '#EF4444', type: 'dashed' },
          data: [{ yAxis: 3, label: { formatter: '低阈值 3', color: '#EF4444', fontSize: 10, position: 'insideEndTop' } }],
        },
      },
      {
        name: '温度(℃)', type: 'line', smooth: true, yAxisIndex: 1, data: trend.map(t => +t.temperature.toFixed(1)),
        itemStyle: { color: '#06B6D4' }, lineStyle: { width: 2, color: '#06B6D4' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.3)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } },
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { color: '#F59E0B', type: 'dashed' },
          data: [{ yAxis: 65, label: { formatter: '预警值 65℃', color: '#F59E0B', fontSize: 10, position: 'insideEndTop' } }],
        },
      },
    ],
  };

  const canConfirm = (o: WorkOrder) => {
    if (!user) return false;
    if (o.status !== 'pending') return false;
    return ['hq_admin', 'oil_worker', 'team_leader', 'block_manager'].includes(user.role);
  };
  const canComplete = (o: WorkOrder) => {
    if (!user) return false;
    if (o.status !== 'confirmed' && o.status !== 'processing' && o.status !== 'escalated') return false;
    return ['hq_admin', 'oil_worker', 'team_leader', 'block_manager'].includes(user.role);
  };

  const woColumns: Column<WorkOrder>[] = [
    { key: 'code', title: '工单号', width: '140px' },
    { key: 'title', title: '标题', width: '180px', render: r => {
      const cd = getOrderCountdown(r);
      return (
        <div>
          <div className="text-white">{r.title}</div>
          {cd && (
            <div className={`text-xs mt-1 flex items-center gap-1 font-mono font-bold ${cd.overdue ? 'text-oil-red animate-pulse' : 'text-oil-yellow'}`}>
              <Clock size={11} />
              {cd.overdue ? `超时 ${cd.text}` : `${cd.text} 后升级`}
            </div>
          )}
        </div>
      );
    }},
    { key: 'priority', title: '优先级', width: '80px', render: r => { const s = woPriorityStyles[r.priority]; return <span className={`px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>; } },
    { key: 'status', title: '状态', width: '90px', render: r => {
      const s = woStatusStyles[r.status];
      return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{s.icon}{s.label}</span>;
    }},
    { key: 'wellName', title: '关联井', width: '80px' },
    { key: 'assignee', title: '负责人', width: '100px' },
    { key: 'createdAt', title: '创建时间', width: '150px', render: r => new Date(r.createdAt).toLocaleString('zh-CN') },
    { key: 'action', title: '操作', width: '160px', align: 'center', render: r => (
      <div className="flex items-center justify-center gap-2">
        {canConfirm(r) && (
          <button
            onClick={() => setOrders(prev => prev.map(x => x.id === r.id ? { ...x, status: 'confirmed', confirmedAt: new Date().toISOString() } : x))}
            className="px-3 py-1 rounded text-xs bg-oil-cyan/20 text-oil-cyan border border-oil-cyan/50 hover:bg-oil-cyan/30 hover:shadow-glow-cyan transition-all flex items-center gap-1"
          >
            <CheckCircle size={12} /> 接单
          </button>
        )}
        {canComplete(r) && (
          <button
            onClick={() => setOrders(prev => prev.map(x => x.id === r.id ? { ...x, status: 'completed', completedAt: new Date().toISOString() } : x))}
            className="px-3 py-1 rounded text-xs bg-oil-green/20 text-oil-green border border-oil-green/50 hover:bg-oil-green/30 hover:shadow-glow-green transition-all flex items-center gap-1"
          >
            <CheckCheck size={12} /> 完成
          </button>
        )}
        {r.status === 'escalated' && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-oil-purple/15 text-oil-purple border border-oil-purple/40">
            <AlertOctagon size={12} /> 已升级
          </span>
        )}
      </div>
    )},
  ];

  const totalProduction = useMemo(() => wells.reduce((s, w) => s + w.dailyProduction, 0), [wells]);

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">采油监控</h2>
        <p className="text-oil-text-muted">井口实时数据 · 历史趋势 · 工单中心 · 自动升级</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-1">
        <div className="bg-oil-panel rounded-xl border border-oil-accent/30 p-5 shadow-glow-blue">
          <div className="flex items-center justify-between mb-2">
            <Droplets className="text-oil-accent" size={22} />
            <span className="text-xs text-oil-green">+3.2%</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalProduction.toFixed(1)}</div>
          <div className="text-sm text-oil-text-muted mt-1">今日总产量(吨)</div>
        </div>
        <div className="bg-oil-panel rounded-xl border border-oil-green/30 p-5 shadow-glow-green">
          <div className="flex items-center justify-between mb-2">
            <div className="w-5 h-5 rounded-full bg-oil-green animate-pulse-slow" />
            <span className="text-xs text-oil-text-muted">{wells.filter(w => w.status === 'running').length}/{wells.length}</span>
          </div>
          <div className="text-3xl font-bold text-white">{wells.filter(w => w.status === 'running').length}</div>
          <div className="text-sm text-oil-text-muted mt-1">运行中井口</div>
        </div>
        <div className="bg-oil-panel rounded-xl border border-oil-red/30 p-5 shadow-glow-red">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="text-oil-red" size={22} />
            <span className="text-xs text-oil-red animate-pulse">待处理</span>
          </div>
          <div className="text-3xl font-bold text-white">{orders.filter(o => o.status === 'pending' || o.status === 'escalated').length}</div>
          <div className="text-sm text-oil-text-muted mt-1">待处理工单</div>
        </div>
        <div className="bg-oil-panel rounded-xl border border-oil-purple/30 p-5 shadow-glow-purple">
          <div className="flex items-center justify-between mb-2">
            <AlertOctagon className="text-oil-purple" size={22} />
            <span className="text-xs text-oil-purple">自动</span>
          </div>
          <div className="text-3xl font-bold text-white">{orders.filter(o => o.status === 'escalated').length}</div>
          <div className="text-sm text-oil-text-muted mt-1">已升级工单</div>
        </div>
      </div>

      <div className="bg-oil-panel rounded-xl border border-oil-accent/20 p-5 shadow-glow-blue">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Droplets className="text-oil-accent" size={20} /> 井口列表 <span className="text-xs text-oil-text-muted font-normal">（点击行查看趋势）</span>
          </h3>
        </div>
        <DataTable<Well>
          columns={wellColumns}
          data={wells.map(w => ({ ...w, _selected: w.id === selectedWellId }))}
          rowKey="id"
          pageSize={8}
          showSearch
          searchPlaceholder="搜索井号/区块/责任人..."
          searchKeys={['name', 'blockName', 'responsible']}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-oil-panel rounded-xl border border-oil-cyan/20 p-5 shadow-glow-cyan">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Thermometer className="text-oil-cyan" size={20} /> 实时趋势 · {selectedWell.name}
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><Droplets size={12} className="text-oil-accent" /> 油压: <span className="text-white font-semibold">{selectedWell.oilPressure.toFixed(1)} MPa</span></span>
              <span className="flex items-center gap-1"><Thermometer size={12} className="text-oil-cyan" /> 温度: <span className="text-white font-semibold">{selectedWell.temperature.toFixed(1)}℃</span></span>
            </div>
          </div>
          <ReactECharts option={trendOption} style={{ height: 320 }} />
        </div>

        <div className="bg-oil-panel rounded-xl border border-oil-yellow/20 p-5 shadow-glow-yellow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="text-oil-yellow" size={20} /> 工单中心
            </h3>
            <div className="text-xs text-oil-text-muted">
              超过 <span className="text-oil-red font-semibold">{ESCALATE_MINUTES}分钟</span> 未接单自动升级
            </div>
          </div>
          <DataTable<WorkOrder>
            columns={woColumns}
            data={orders}
            rowKey="id"
            pageSize={5}
            showSearch
            searchPlaceholder="搜索工单号/标题/井号..."
            searchKeys={['code', 'title', 'wellName']}
          />
        </div>
      </div>
    </div>
  );
}
