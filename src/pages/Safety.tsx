import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  AlertTriangle,
  Shield,
  AlertCircle,
  Flame,
  Wind,
  Thermometer,
  Gauge,
  PowerOff,
  ListChecks,
  Clock,
  CheckSquare,
  Square,
  Filter,
  Search,
  X,
  AlertOctagon,
  ChevronDown,
} from 'lucide-react';
import DataTable, { type Column } from '@/components/DataTable';
import { useUserStore } from '@/store/userStore';
import http from '@/utils/request';
import type { SafetyAlertLevel } from '@/types';

interface Sensor {
  id: string;
  name: string;
  type: 'gas' | 'h2s' | 'ch4' | 'co' | 'temp' | 'pressure';
  location: string;
  value: number;
  unit: string;
  thresholdLow: number;
  thresholdWarning: number;
  thresholdCritical: number;
  status: 'normal' | 'warning' | 'critical';
  lastUpdate: string;
  icon: React.ReactNode;
  color: string;
}

interface EmergencyStep {
  id: string;
  order: number;
  content: string;
  responsible: string;
  checked: boolean;
  checkedAt?: string;
}

interface HistoryAlert {
  id: string;
  code: string;
  level: SafetyAlertLevel;
  title: string;
  sensorName: string;
  location: string;
  value: number;
  threshold: number;
  unit: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  status: 'triggered' | 'acknowledged' | 'resolved';
  handler: string;
  notes?: string;
}

const createInitialSensors = (): Sensor[] => [
  { id: 'S001', name: '甲烷浓度-1号', type: 'ch4', location: 'A区联合站', value: 0.18, unit: '%LEL', thresholdLow: 0, thresholdWarning: 20, thresholdCritical: 50, status: 'normal', lastUpdate: new Date().toISOString(), icon: <Flame size={22} />, color: '#f59e0b' },
  { id: 'S002', name: '硫化氢浓度-1号', type: 'h2s', location: 'B区转油站', value: 8.6, unit: 'ppm', thresholdLow: 0, thresholdWarning: 20, thresholdCritical: 50, status: 'normal', lastUpdate: new Date().toISOString(), icon: <Wind size={22} />, color: '#10b981' },
  { id: 'S003', name: '可燃气体-储罐区', type: 'gas', location: 'C区储罐区', value: 32, unit: '%LEL', thresholdLow: 0, thresholdWarning: 25, thresholdCritical: 50, status: 'warning', lastUpdate: new Date().toISOString(), icon: <AlertCircle size={22} />, color: '#ef4444' },
  { id: 'S004', name: '一氧化碳-泵房', type: 'co', location: 'D区泵房', value: 18, unit: 'ppm', thresholdLow: 0, thresholdWarning: 35, thresholdCritical: 100, status: 'normal', lastUpdate: new Date().toISOString(), icon: <Wind size={22} />, color: '#6366f1' },
  { id: 'S005', name: '原油温度-T01', type: 'temp', location: 'A区储罐T-01', value: 62.4, unit: '℃', thresholdLow: 0, thresholdWarning: 65, thresholdCritical: 80, status: 'normal', lastUpdate: new Date().toISOString(), icon: <Thermometer size={22} />, color: '#f59e0b' },
  { id: 'S006', name: '分离器压力', type: 'pressure', location: 'B区三相分离器', value: 0.85, unit: 'MPa', thresholdLow: 0, thresholdWarning: 1.2, thresholdCritical: 1.6, status: 'normal', lastUpdate: new Date().toISOString(), icon: <Gauge size={22} />, color: '#06b6d4' },
  { id: 'S007', name: '硫化氢-井口A03', type: 'h2s', location: 'A-03井口', value: 72, unit: 'ppm', thresholdLow: 0, thresholdWarning: 20, thresholdCritical: 50, status: 'critical', lastUpdate: new Date().toISOString(), icon: <AlertTriangle size={22} />, color: '#ef4444' },
  { id: 'S008', name: '甲烷-锅炉房', type: 'ch4', location: '锅炉房', value: 12, unit: '%LEL', thresholdLow: 0, thresholdWarning: 25, thresholdCritical: 50, status: 'normal', lastUpdate: new Date().toISOString(), icon: <Flame size={22} />, color: '#8b5cf6' },
];

const emergencySteps: EmergencyStep[] = [
  { id: 'ST1', order: 1, content: '启动现场声光报警器，通知周边人员立即撤离至安全集合点', responsible: '现场操作员', checked: false },
  { id: 'ST2', order: 2, content: '切断A-03井口及对应管线进出口阀门，隔离危险源', responsible: '采油班长', checked: false },
  { id: 'ST3', order: 3, content: '启动固定式硫化氢检测装置及便携式检测仪持续监测', responsible: '安全监护员', checked: false },
  { id: 'ST4', order: 4, content: '佩戴正压式呼吸器进入现场实施初步处置', responsible: '应急救援小组', checked: false },
  { id: 'ST5', order: 5, content: '向中心调度室报告情况，通知医疗、消防联动', responsible: '值班干部', checked: false },
  { id: 'ST6', order: 6, content: '风向确认后开启喷淋系统，在上风向设置警戒区域', responsible: '安全监护员', checked: false },
];

const mockAlerts: HistoryAlert[] = [
  { id: 'HA001', code: 'AQ-20260617-023', level: 'critical', title: '硫化氢严重超标', sensorName: '硫化氢-井口A03', location: 'A-03井口', value: 72, threshold: 50, unit: 'ppm', triggeredAt: new Date(Date.now() - 20 * 60000).toISOString(), status: 'acknowledged', handler: '张安全', acknowledgedAt: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 'HA002', code: 'AQ-20260617-022', level: 'warning', title: '可燃气体浓度偏高', sensorName: '可燃气体-储罐区', location: 'C区储罐区', value: 32, threshold: 25, unit: '%LEL', triggeredAt: new Date(Date.now() - 55 * 60000).toISOString(), status: 'acknowledged', handler: '王储运', acknowledgedAt: new Date(Date.now() - 48 * 60000).toISOString() },
  { id: 'HA003', code: 'AQ-20260617-018', level: 'warning', title: '原油温度预警', sensorName: '原油温度-T02', location: 'C区T-02罐', value: 67.2, threshold: 65, unit: '℃', triggeredAt: new Date(Date.now() - 3 * 3600000).toISOString(), status: 'resolved', handler: '李调度', acknowledgedAt: new Date(Date.now() - 3 * 3600000 + 120000).toISOString(), resolvedAt: new Date(Date.now() - 2.5 * 3600000).toISOString(), notes: '冷却水系统流量加大后恢复正常' },
  { id: 'HA004', code: 'AQ-20260616-098', level: 'error', title: '硫化氢浓度报警', sensorName: '硫化氢-1号', location: 'B区转油站', value: 34, threshold: 20, unit: 'ppm', triggeredAt: new Date(Date.now() - 18 * 3600000).toISOString(), status: 'resolved', handler: '张安全', acknowledgedAt: new Date(Date.now() - 18 * 3600000 + 180000).toISOString(), resolvedAt: new Date(Date.now() - 17 * 3600000).toISOString(), notes: '密封垫老化更换，恢复正常' },
  { id: 'HA005', code: 'AQ-20260616-071', level: 'error', title: '分离器压力超高', sensorName: '分离器压力', location: 'B区分离器', value: 1.5, threshold: 1.2, unit: 'MPa', triggeredAt: new Date(Date.now() - 28 * 3600000).toISOString(), status: 'resolved', handler: '孙工艺', acknowledgedAt: new Date(Date.now() - 28 * 3600000 + 240000).toISOString(), resolvedAt: new Date(Date.now() - 27 * 3600000).toISOString() },
  { id: 'HA006', code: 'AQ-20260615-054', level: 'critical', title: '高压管线泄漏', sensorName: '压力传感器PL-15', location: 'A区外输管线', value: 0, threshold: 0, unit: 'MPa', triggeredAt: new Date(Date.now() - 52 * 3600000).toISOString(), status: 'resolved', handler: '赵维修', resolvedAt: new Date(Date.now() - 48 * 3600000).toISOString(), notes: '焊接补漏，已试压合格' },
  { id: 'HA007', code: 'AQ-20260615-031', level: 'info', title: '消防水泵巡检', sensorName: '消防水泵状态', location: '中控楼消防泵', value: 0, threshold: 0, unit: '-', triggeredAt: new Date(Date.now() - 66 * 3600000).toISOString(), status: 'resolved', handler: '系统自动' },
  { id: 'HA008', code: 'AQ-20260614-112', level: 'warning', title: '烟气排放口温度', sensorName: '烟气温度-加热炉', location: 'D区加热炉', value: 228, threshold: 200, unit: '℃', triggeredAt: new Date(Date.now() - 88 * 3600000).toISOString(), status: 'resolved', handler: '陈工艺', acknowledgedAt: new Date(Date.now() - 88 * 3600000 + 360000).toISOString(), resolvedAt: new Date(Date.now() - 86 * 3600000).toISOString() },
];

const alertLevelStyles: Record<SafetyAlertLevel, { bg: string; text: string; border: string; label: string; dot: string }> = {
  info: { bg: 'bg-oil-cyan/20', text: 'text-oil-cyan', border: 'border-oil-cyan/50', label: '提示', dot: 'bg-oil-cyan' },
  warning: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '预警', dot: 'bg-oil-yellow' },
  error: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-400/50', label: '报警', dot: 'bg-orange-400' },
  critical: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '严重', dot: 'bg-oil-red animate-pulse' },
};

const alertStatusStyles: Record<HistoryAlert['status'], { bg: string; text: string; border: string; label: string }> = {
  triggered: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '未处理' },
  acknowledged: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '已确认' },
  resolved: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '已解除' },
};

function gaugeOption(s: Sensor) {
  const statusColor = s.status === 'critical' ? '#ef4444' : s.status === 'warning' ? '#f59e0b' : s.color;
  const max = s.type === 'gas' || s.type === 'ch4' ? 100 : s.type === 'h2s' ? 100 : s.type === 'co' ? 200 : s.type === 'temp' ? 120 : s.type === 'pressure' ? 2.0 : 100;
  return {
    series: [
      {
        type: 'gauge',
        center: ['50%', '58%'],
        radius: '82%',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max,
        splitNumber: 5,
        progress: { show: true, width: 14, itemStyle: { color: statusColor } },
        axisLine: { lineStyle: { width: 14, color: [[s.thresholdWarning / max, '#10b981'], [s.thresholdCritical / max, '#f59e0b'], [1, '#ef4444']] } },
        pointer: { icon: 'triangle', length: '55%', width: 10, itemStyle: { color: statusColor } },
        axisTick: { distance: -22, length: 6, lineStyle: { color: '#475569', width: 1 } },
        splitLine: { distance: -28, length: 12, lineStyle: { color: '#64748b', width: 2 } },
        axisLabel: { distance: -40, color: '#94a3b8', fontSize: 9, formatter: (v: number) => v },
        anchor: { show: true, size: 14, itemStyle: { color: statusColor, borderColor: '#0A1628', borderWidth: 3 } },
        title: { show: false },
        detail: {
          valueAnimation: true,
          formatter: `{value} ${s.unit}`,
          color: statusColor,
          fontSize: 18,
          fontWeight: 'bold',
          offsetCenter: [0, '18%'],
        },
        data: [{ value: Number(s.value.toFixed(s.type === 'pressure' ? 2 : 1)) }],
      },
    ],
  };
}

export default function Safety() {
  const { user } = useUserStore();
  const [sensors, setSensors] = useState<Sensor[]>(createInitialSensors());
  const [steps, setSteps] = useState<EmergencyStep[]>(emergencySteps);
  const [alerts] = useState<HistoryAlert[]>(mockAlerts);
  const [levelFilter, setLevelFilter] = useState<SafetyAlertLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<HistoryAlert['status'] | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string } | null>(null);
  const [showShutdown, setShowShutdown] = useState(false);
  const [, force] = useState(0);

  const hasActiveCritical = sensors.some(s => s.status === 'critical');
  const hasActiveWarning = sensors.some(s => s.status === 'warning');
  const anyActive = hasActiveCritical || hasActiveWarning;

  const canHandle = user && ['hq_admin', 'safety_officer', 'block_manager', 'team_leader'].includes(user.role as string);

  useEffect(() => {
    try { http.get('/safety/sensors'); } catch {}
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSensors(prev => prev.map(s => {
        let v = s.value + (Math.random() - 0.5) * (s.type === 'pressure' ? 0.08 : s.type === 'temp' ? 1.2 : 3);
        if (s.type === 'h2s' && s.id === 'S007') { v = 65 + Math.random() * 15; }
        if (s.type === 'gas' && s.id === 'S003') { v = 25 + Math.random() * 15; }
        const val = Math.max(0, v);
        let status: Sensor['status'] = 'normal';
        if (val >= s.thresholdCritical) status = 'critical';
        else if (val >= s.thresholdWarning) status = 'warning';
        return { ...s, value: Number(val.toFixed(s.type === 'pressure' ? 2 : 1)), status, lastUpdate: new Date().toISOString() };
      }));
      force(n => n + 1);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const toggleStep = (stepId: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, checked: !s.checked, checkedAt: !s.checked ? new Date().toISOString() : undefined } : s));
  };

  const handleShutdown = () => {
    setShowShutdown(false);
    setSteps(prev => prev.map(s => ({ ...s, checked: true, checkedAt: new Date().toISOString() })));
  };

  const filteredAlerts = alerts.filter(a => {
    if (levelFilter !== 'all' && a.level !== levelFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (dateFilter) {
      const at = new Date(a.triggeredAt).getTime();
      if (dateFilter.start && at < new Date(dateFilter.start).getTime()) return false;
      if (dateFilter.end && at > new Date(dateFilter.end).getTime() + 86400000) return false;
    }
    return true;
  });

  const historyColumns: Column<HistoryAlert>[] = [
    { key: 'code', title: '告警编号', width: '150px' },
    { key: 'level', title: '级别', width: '70px', align: 'center', render: r => { const s = alertLevelStyles[r.level]; return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}</span>; } },
    { key: 'title', title: '告警标题', width: '180px', render: r => <span className="text-white">{r.title}</span> },
    { key: 'location', title: '位置', width: '120px' },
    { key: 'sensorName', title: '传感器', width: '150px', render: r => <span className="text-oil-cyan text-xs">{r.sensorName}</span> },
    { key: 'value', title: '实测/阈值', width: '110px', render: r => <span className="text-sm"><span className={r.value >= r.threshold ? 'text-oil-red font-semibold' : 'text-white'}>{r.value}</span> <span className="text-oil-text-muted">/ {r.threshold}{r.unit}</span></span> },
    { key: 'status', title: '处理状态', width: '80px', render: r => { const s = alertStatusStyles[r.status]; return <span className={`px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>; } },
    { key: 'handler', title: '处理人', width: '80px' },
    { key: 'triggeredAt', title: '触发时间', width: '170px', render: r => new Date(r.triggeredAt).toLocaleString('zh-CN') },
    { key: 'notes', title: '备注', width: '160px', render: r => r.notes ? <span className="text-oil-text-muted text-xs">{r.notes.slice(0, 18)}…</span> : <span className="text-oil-text-muted/50">-</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">安全环保监测</h2>
          <p className="text-oil-text-muted">实时传感器 · 应急预案 · 历史告警溯源</p>
        </div>
        {anyActive && (
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm animate-pulse-slow ${hasActiveCritical ? 'bg-oil-red/15 border-oil-red/60 text-oil-red' : 'bg-oil-yellow/15 border-oil-yellow/60 text-oil-yellow'}`}>
            <AlertOctagon size={18} />
            <div>
              <div className="font-semibold">{hasActiveCritical ? '严重告警活跃中' : '预警活跃'}</div>
              <div className="text-[10px] opacity-80">
                关键{hasActiveCritical ? `${sensors.filter(s => s.status === 'critical').length}项` : '0项'} · 预警{sensors.filter(s => s.status === 'warning').length}项
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.map(s => {
          const blink = s.status === 'critical';
          const warn = s.status === 'warning';
          return (
            <div key={s.id} className={`bg-oil-panel rounded-xl border p-4 transition-all ${blink ? 'border-oil-red animate-blink-border' : warn ? 'border-oil-yellow/60 shadow-glow-green' : 'border-oil-accent/30 hover:border-oil-accent/60'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${blink ? 'bg-oil-red/15 border-oil-red/60 text-oil-red' : warn ? 'bg-oil-yellow/15 border-oil-yellow/60 text-oil-yellow' : 'bg-oil-accent/10 border-oil-accent/40 text-oil-accent'}`}>
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium leading-tight">{s.name}</div>
                    <div className="text-[10px] text-oil-text-muted">{s.location}</div>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${s.status === 'critical' ? 'bg-oil-red/20 text-oil-red border-oil-red/50 animate-pulse' : s.status === 'warning' ? 'bg-oil-yellow/20 text-oil-yellow border-oil-yellow/50' : 'bg-oil-green/20 text-oil-green border-oil-green/50'}`}>
                  {s.status === 'critical' ? '超标' : s.status === 'warning' ? '预警' : '正常'}
                </span>
              </div>
              <div className="h-36 -my-2">
                <ReactECharts option={gaugeOption(s)} style={{ height: '100%', width: '100%' }} notMerge />
              </div>
              <div className="text-[10px] text-oil-text-muted flex items-center justify-between pt-1 border-t border-oil-accent/10">
                <span className="flex items-center gap-1"><Clock size={9} /> {new Date(s.lastUpdate).toLocaleTimeString('zh-CN')}</span>
                <span>阈值: {s.thresholdWarning}{s.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`bg-oil-panel rounded-xl border p-5 transition-all ${hasActiveCritical ? 'border-oil-red/50 shadow-glow-red' : anyActive ? 'border-oil-yellow/50' : 'border-oil-accent/30'}`}>
        <div className="flex items-start justify-between mb-5 pb-4 border-b border-oil-accent/20">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ListChecks className={hasActiveCritical ? 'text-oil-red' : hasActiveWarning ? 'text-oil-yellow' : 'text-oil-green'} size={22} />
              <h3 className="text-lg font-bold text-white">
                应急处置预案
                {!anyActive && <span className="ml-2 text-xs font-normal text-oil-green">（当前无活跃告警，预案待命）</span>}
                {anyActive && <span className="ml-2 text-xs font-normal animate-pulse-slow text-oil-yellow">（活跃告警中，请按步骤执行）</span>}
              </h3>
            </div>
            <p className="text-sm text-oil-text-muted ml-7">
              {hasActiveCritical ? 'A-03井口硫化氢严重超标，请立即启动《含硫井喷应急预案V2.3》' : hasActiveWarning ? 'C区储罐区可燃气体浓度偏高，按《储罐区泄漏处置方案》处理' : '预案待命中'}
            </p>
          </div>
          {canHandle && anyActive && (
            <button onClick={() => setShowShutdown(true)} className="px-4 py-2.5 rounded-xl bg-oil-red text-white hover:shadow-glow-red transition-all flex items-center gap-2 text-sm font-semibold animate-pulse-slow">
              <PowerOff size={18} /> 执行自动关断
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
          {steps.map((st, idx) => {
            const canUncheck = anyActive;
            return (
              <div key={st.id} className="group relative">
                {idx < steps.length - 1 && idx % 2 === 0 && (
                  <div className="hidden md:block absolute left-[22px] top-[42px] w-0.5 h-8 border-l-2 border-dashed border-oil-accent/20" />
                )}
                <label className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${st.checked ? 'bg-oil-green/8 border-oil-green/40' : anyActive ? 'bg-oil-panel-light border-oil-accent/30 hover:border-oil-accent/60 group-hover:scale-[1.01]' : 'bg-oil-panel-light/50 border-oil-accent/20 opacity-70'}`}>
                  <button onClick={() => (canUncheck || !st.checked) && toggleStep(st.id)} disabled={!anyActive && !st.checked} className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-all ${st.checked ? 'bg-oil-green border-oil-green' : anyActive ? 'border-oil-accent/60 hover:border-oil-accent hover:bg-oil-accent/10' : 'border-oil-text-muted/30'}`}>
                    {st.checked ? <CheckSquare size={14} className="text-white" /> : <Square size={14} className="text-transparent" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${st.checked ? 'bg-oil-green text-white' : 'bg-oil-accent/20 text-oil-accent border border-oil-accent/40'}`}>{st.order}</span>
                      <span className={`text-sm font-medium ${st.checked ? 'text-oil-green line-through decoration-oil-green/40' : 'text-white'}`}>{st.content}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-oil-text-muted ml-8">
                      <span>负责：<span className="text-oil-text">{st.responsible}</span></span>
                      {st.checked && st.checkedAt && <span className="text-oil-green">✓ {new Date(st.checkedAt).toLocaleTimeString('zh-CN')}</span>}
                    </div>
                  </div>
                </label>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-oil-accent/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-48 h-2 bg-oil-panel-light rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${steps.filter(s => s.checked).length === steps.length ? 'bg-oil-green' : 'bg-oil-accent'}`} style={{ width: `${(steps.filter(s => s.checked).length / steps.length) * 100}%` }} />
            </div>
            <span className={`font-semibold ${steps.filter(s => s.checked).length === steps.length ? 'text-oil-green' : 'text-white'}`}>
              处置进度 {steps.filter(s => s.checked).length}/{steps.length}
            </span>
          </div>
          <div className="text-xs text-oil-text-muted">
            最后更新：{new Date().toLocaleTimeString('zh-CN')}
          </div>
        </div>
      </div>

      <div className="bg-oil-panel rounded-xl border border-oil-accent/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="text-oil-cyan" size={20} /> 历史告警记录
              <span className="ml-2 text-xs font-normal text-oil-text-muted">（共{filteredAlerts.length}条）</span>
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter size={12} className="text-oil-text-muted" />
              <div className="flex bg-oil-panel-light rounded-lg p-1 border border-oil-accent/20">
                {(['all', 'critical', 'error', 'warning', 'info'] as const).map(l => (
                  <button key={l} onClick={() => setLevelFilter(l)} className={`px-3 py-1 rounded text-xs transition-all ${levelFilter === l ? 'bg-oil-accent text-white' : 'text-oil-text-muted hover:text-white'}`}>
                    {l === 'all' ? '全部' : alertLevelStyles[l as SafetyAlertLevel].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'triggered', 'acknowledged', 'resolved'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded text-xs transition-all ${statusFilter === s ? 'bg-oil-accent/20 text-oil-accent border border-oil-accent/40' : 'text-oil-text-muted hover:text-white border border-transparent'}`}>
                  {s === 'all' ? '全部状态' : alertStatusStyles[s as HistoryAlert['status']].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs bg-oil-panel-light rounded-lg px-2 py-1.5 border border-oil-accent/20">
              <input type="date" value={dateFilter?.start || ''} onChange={e => setDateFilter(prev => ({ start: e.target.value, end: prev?.end || '' }))} className="bg-transparent text-oil-text outline-none w-[110px]" />
              <span className="text-oil-text-muted">~</span>
              <input type="date" value={dateFilter?.end || ''} onChange={e => setDateFilter(prev => ({ start: prev?.start || '', end: e.target.value }))} className="bg-transparent text-oil-text outline-none w-[110px]" />
              {(dateFilter?.start || dateFilter?.end) && (
                <button onClick={() => setDateFilter(null)} className="text-oil-text-muted hover:text-white ml-1"><X size={12} /></button>
              )}
            </div>
          </div>
        </div>
        <DataTable<HistoryAlert> columns={historyColumns} data={filteredAlerts} title="" rowKey="id" pageSize={8} searchPlaceholder="搜索告警编号/标题/位置..." searchKeys={['code', 'title', 'location', 'sensorName']} />
      </div>

      {showShutdown && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setShowShutdown(false)}>
          <div className="bg-oil-panel border-2 border-oil-red/70 rounded-2xl shadow-glow-red w-full max-w-lg overflow-hidden animate-pulse-slow" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 bg-oil-red/10 border-b border-oil-red/30">
              <h3 className="text-xl font-bold text-oil-red flex items-center gap-3">
                <AlertOctagon size={26} /> 确认执行自动关断？
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-white text-sm leading-relaxed">系统将执行以下连锁动作：</p>
              <div className="space-y-2 text-sm">
                {['A-03井口安全截断阀（SDV-103）关闭', 'A区集油支线紧急隔离', '井口平台应急排放系统启动', '相关机泵组动力切断', '中控室声光报警、短信通知值班人员'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-oil-panel-light border border-oil-red/20">
                    <PowerOff size={14} className="text-oil-red flex-shrink-0" />
                    <span className="text-oil-text">{t}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-oil-yellow flex items-start gap-1.5 p-3 rounded-lg bg-oil-yellow/10 border border-oil-yellow/30">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>此操作不可逆，请确认已现场核实并获得值班干部授权！</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-oil-accent/20 flex justify-end gap-3">
              <button onClick={() => setShowShutdown(false)} className="px-5 py-2.5 rounded-xl border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 text-sm">取消</button>
              <button onClick={handleShutdown} className="px-6 py-2.5 rounded-xl bg-oil-red text-white hover:shadow-glow-red text-sm font-semibold flex items-center gap-2">
                <PowerOff size={16} /> 确认关断
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
