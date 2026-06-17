import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  BarChart3,
  Gauge,
  Droplets,
  Cpu,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import AlertTimeline, { type AlertItem } from '@/components/AlertTimeline';
import { useUserStore } from '@/store/userStore';
import http from '@/utils/request';

interface BlockProduction {
  blockId: string;
  blockName: string;
  daily: number;
  monthly: number;
  yearly: number;
}

interface BlockIntegrity {
  blockId: string;
  blockName: string;
  rate: number;
}

interface TankLevel {
  id: string;
  name: string;
  level: number;
  capacity: number;
  lowThreshold: number;
  highThreshold: number;
}

interface WellRealtime {
  id: string;
  name: string;
  oilPressure: number;
  temperature: number;
}

interface DashboardStatsData {
  dailyProduction: number;
  dailyProductionChange: number;
  integrityRateAvg: number;
  integrityRateChange: number;
  avgTankLevel: number;
  avgTankLevelChange: number;
  runningEquipment: number;
  runningEquipmentChange: number;
  blockProductions: BlockProduction[];
  blockIntegrities: BlockIntegrity[];
  tankLevels: TankLevel[];
  wells: WellRealtime[];
  alerts: AlertItem[];
}

const mockStats: DashboardStatsData = {
  dailyProduction: 12856.8,
  dailyProductionChange: 3.2,
  integrityRateAvg: 96.4,
  integrityRateChange: 0.8,
  avgTankLevel: 68.5,
  avgTankLevelChange: -1.5,
  runningEquipment: 284,
  runningEquipmentChange: 2.1,
  blockProductions: [
    { blockId: 'A', blockName: 'A区采油厂', daily: 3256, monthly: 98540, yearly: 1186200 },
    { blockId: 'B', blockName: 'B区采油厂', daily: 2984, monthly: 89620, yearly: 1072300 },
    { blockId: 'C', blockName: 'C区采油厂', daily: 3542, monthly: 106780, yearly: 1289500 },
    { blockId: 'D', blockName: 'D区采油厂', daily: 3074, monthly: 92160, yearly: 1108900 },
  ],
  blockIntegrities: [
    { blockId: 'A', blockName: 'A区', rate: 97.2 },
    { blockId: 'B', blockName: 'B区', rate: 95.8 },
    { blockId: 'C', blockName: 'C区', rate: 96.5 },
    { blockId: 'D', blockName: 'D区', rate: 95.1 },
  ],
  tankLevels: [
    { id: 'T001', name: 'T-101原油罐', level: 72, capacity: 5000, lowThreshold: 20, highThreshold: 85 },
    { id: 'T002', name: 'T-102原油罐', level: 58, capacity: 5000, lowThreshold: 20, highThreshold: 85 },
    { id: 'T003', name: 'T-201成品油罐', level: 88, capacity: 3000, lowThreshold: 15, highThreshold: 85 },
    { id: 'T004', name: 'T-202成品油罐', level: 12, capacity: 3000, lowThreshold: 15, highThreshold: 85 },
    { id: 'T005', name: 'T-301柴油罐', level: 45, capacity: 2000, lowThreshold: 20, highThreshold: 90 },
    { id: 'T006', name: 'T-302汽油罐', level: 63, capacity: 2000, lowThreshold: 20, highThreshold: 90 },
  ],
  wells: [
    { id: 'W001', name: 'A-01井', oilPressure: 8.6, temperature: 62.4 },
    { id: 'W002', name: 'A-02井', oilPressure: 7.2, temperature: 58.1 },
    { id: 'W003', name: 'A-03井', oilPressure: 9.1, temperature: 65.7 },
    { id: 'W004', name: 'B-01井', oilPressure: 6.8, temperature: 55.2 },
    { id: 'W005', name: 'B-02井', oilPressure: 8.2, temperature: 61.3 },
    { id: 'W006', name: 'C-01井', oilPressure: 9.5, temperature: 67.8 },
    { id: 'W007', name: 'C-02井', oilPressure: 7.9, temperature: 59.6 },
    { id: 'W008', name: 'D-01井', oilPressure: 8.0, temperature: 60.0 },
  ],
  alerts: [
    { id: '1', level: 'critical', title: 'T-202罐液位过低', description: '当前液位12%，低于安全阈值15%，请及时补料', source: '储罐监测系统', time: new Date(Date.now() - 3 * 60000).toISOString() },
    { id: '2', level: 'error', title: 'C-01井温度异常', description: '井口温度67.8℃，超过预警值65℃', source: '采油监控系统', time: new Date(Date.now() - 18 * 60000).toISOString() },
    { id: '3', level: 'warning', title: 'T-201罐液位过高', description: '当前液位88%，接近上限85%，请注意转油', source: '储罐监测系统', time: new Date(Date.now() - 42 * 60000).toISOString() },
    { id: '4', level: 'warning', title: 'A区管线压力波动', description: '集输干线压力波动超过±10%，已加强监测', source: '集输系统', time: new Date(Date.now() - 85 * 60000).toISOString() },
    { id: '5', level: 'info', title: '日巡检计划已生成', description: '今日共生成32条巡检任务，已分派至各班组', source: '设备运维系统', time: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: '6', level: 'info', title: '月度报表已审批通过', description: '5月生产月报经总工程师审批通过，可归档', source: '系统消息', time: new Date(Date.now() - 8 * 3600000).toISOString() },
  ],
};

export default function Dashboard() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<DashboardStatsData>(mockStats);
  const [productionType, setProductionType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedWellId, setSelectedWellId] = useState<string>(mockStats.wells[0].id);
  const [wellDropdown, setWellDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await http.get<DashboardStatsData>('/dashboard/stats');
      if (data) {
        setStats(data);
      } else {
        throw new Error('no data');
      }
    } catch {
      setStats({
        ...mockStats,
        dailyProduction: mockStats.dailyProduction + (Math.random() - 0.5) * 500,
        blockProductions: mockStats.blockProductions.map(b => ({
          ...b,
          daily: b.daily + Math.floor((Math.random() - 0.5) * 200),
        })),
        wells: mockStats.wells.map(w => ({
          ...w,
          oilPressure: +(w.oilPressure + (Math.random() - 0.5) * 1).toFixed(1),
          temperature: +(w.temperature + (Math.random() - 0.5) * 3).toFixed(1),
        })),
        tankLevels: mockStats.tankLevels.map(t => ({
          ...t,
          level: Math.max(5, Math.min(95, t.level + Math.floor((Math.random() - 0.5) * 5))),
        })),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 5000);
    return () => clearInterval(timer);
  }, []);

  const safeWells = stats.wells || mockStats.wells;
  const selectedWell = safeWells.find(w => w.id === selectedWellId) || safeWells[0];

  const blockProductionOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(17,34,64,0.95)', borderColor: '#3B82F6', textStyle: { color: '#CBD5E1' } },
    legend: { data: ['日产量', '月产量', '年产量'], textStyle: { color: '#64748B' }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
    xAxis: { type: 'category', data: (stats.blockProductions || mockStats.blockProductions).map(b => b.blockName), axisLine: { lineStyle: { color: '#3B82F640' } }, axisLabel: { color: '#CBD5E1' } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#3B82F640' } }, axisLabel: { color: '#64748B' }, splitLine: { lineStyle: { color: '#3B82F620' } } },
    series: [
      { name: '日产量', type: 'bar', data: (stats.blockProductions || mockStats.blockProductions).map(b => b.daily), itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 30 },
      { name: '月产量(÷30)', type: 'bar', data: (stats.blockProductions || mockStats.blockProductions).map(b => Math.floor(b.monthly / 30)), itemStyle: { color: '#06B6D4', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 30 },
      { name: '年产量(÷365)', type: 'bar', data: (stats.blockProductions || mockStats.blockProductions).map(b => Math.floor(b.yearly / 365)), itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 30 },
    ],
  };

  const integrityRingOption = {
    tooltip: { trigger: 'item', backgroundColor: 'rgba(17,34,64,0.95)', borderColor: '#3B82F6', textStyle: { color: '#CBD5E1' } },
    series: (stats.blockIntegrities || mockStats.blockIntegrities).map((block, i) => ({
      name: block.blockName,
      type: 'pie',
      radius: [`${15 + i * 18}%`, `${28 + i * 18}%`],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: {
        show: i === (stats.blockIntegrities || mockStats.blockIntegrities).length - 1,
        position: 'center',
        formatter: `{a|${block.rate}%}\n{b|完好率}`,
        rich: {
          a: { fontSize: 32, fontWeight: 'bold', color: ['#3B82F6', '#06B6D4', '#10B981', '#8B5CF6'][i] },
          b: { fontSize: 12, color: '#64748B', padding: [8, 0, 0, 0] },
        },
      },
      labelLine: { show: false },
      data: [
        { value: block.rate, name: '完好', itemStyle: { color: ['#3B82F6', '#06B6D4', '#10B981', '#8B5CF6'][i] } },
        { value: 100 - block.rate, name: '异常', itemStyle: { color: '#3B82F620' } },
      ],
    })),
  };

  const tankLevelOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(17,34,64,0.95)', borderColor: '#3B82F6', textStyle: { color: '#CBD5E1' }, axisPointer: { type: 'shadow' } },
    legend: { data: ['液位', '低阈值', '高阈值'], textStyle: { color: '#64748B' }, top: 0 },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: '#3B82F640' } }, axisLabel: { color: '#64748B', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#3B82F620' } } },
    yAxis: { type: 'category', data: (stats.tankLevels || mockStats.tankLevels).map(t => t.name), axisLine: { lineStyle: { color: '#3B82F640' } }, axisLabel: { color: '#CBD5E1' } },
    series: [
      {
        name: '液位',
        type: 'bar',
        barWidth: 14,
        data: (stats.tankLevels || mockStats.tankLevels).map(t => ({
          value: t.level,
          itemStyle: {
            color: t.level < t.lowThreshold ? '#EF4444' : t.level > t.highThreshold ? '#F59E0B' : new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#06B6D4' },
              { offset: 1, color: '#3B82F6' },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
        })),
        markLine: {
          silent: true,
          symbol: 'none',
          data: (stats.tankLevels || mockStats.tankLevels).flatMap((t, i) => [
            { yAxis: i, xAxis: t.lowThreshold, lineStyle: { color: '#EF4444', type: 'dashed' }, label: { show: false } },
            { yAxis: i, xAxis: t.highThreshold, lineStyle: { color: '#F59E0B', type: 'dashed' }, label: { show: false } },
          ]),
        },
      },
    ],
  };

  const pressureGaugeOption = {
    series: [{
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 15,
      progress: { show: true, width: 14, itemStyle: { color: '#3B82F6' } },
      axisLine: { lineStyle: { width: 14, color: [[1, '#3B82F630']] } },
      axisTick: { show: false },
      splitLine: { length: 8, lineStyle: { color: '#64748B', width: 1 } },
      axisLabel: { color: '#64748B', fontSize: 10, distance: -18 },
      pointer: { width: 4, length: '65%', itemStyle: { color: '#3B82F6' } },
      anchor: { show: true, size: 12, itemStyle: { color: '#3B82F6', borderColor: '#fff', borderWidth: 2 } },
      title: { offsetCenter: [0, '75%'], fontSize: 12, color: '#64748B' },
      detail: { offsetCenter: [0, '45%'], valueAnimation: true, fontSize: 24, fontWeight: 'bold', color: '#CBD5E1', formatter: '{value}' },
      data: [{ value: selectedWell.oilPressure, name: '油压 (MPa)' }],
    }],
  };

  const temperatureGaugeOption = {
    series: [{
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      progress: { show: true, width: 14, itemStyle: { color: selectedWell.temperature > 65 ? '#EF4444' : '#06B6D4' } },
      axisLine: { lineStyle: { width: 14, color: [[0.65, '#06B6D430'], [1, '#EF444430']] } },
      axisTick: { show: false },
      splitLine: { length: 8, lineStyle: { color: '#64748B', width: 1 } },
      axisLabel: { color: '#64748B', fontSize: 10, distance: -18 },
      pointer: { width: 4, length: '65%', itemStyle: { color: selectedWell.temperature > 65 ? '#EF4444' : '#06B6D4' } },
      anchor: { show: true, size: 12, itemStyle: { color: selectedWell.temperature > 65 ? '#EF4444' : '#06B6D4', borderColor: '#fff', borderWidth: 2 } },
      title: { offsetCenter: [0, '75%'], fontSize: 12, color: '#64748B' },
      detail: { offsetCenter: [0, '45%'], valueAnimation: true, fontSize: 24, fontWeight: 'bold', color: '#CBD5E1', formatter: '{value}℃' },
      data: [{ value: selectedWell.temperature, name: '温度' }],
    }],
  };

  const prodLabels = { daily: '日', monthly: '月', yearly: '年' };

  return (
    <div className="space-y-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">欢迎回来，{user?.name}</h2>
          <p className="text-oil-text-muted">油田运营核心数据概览 · 实时更新中 <RefreshCw size={12} className={`inline ml-1 ${loading ? 'animate-spin text-oil-accent' : 'text-oil-text-muted'}`} /></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="当日总产量"
          value={(stats.dailyProduction ?? mockStats.dailyProduction).toLocaleString()}
          unit="吨"
          change={stats.dailyProductionChange ?? mockStats.dailyProductionChange}
          icon={<BarChart3 size={24} />}
          glowColor="blue"
        />
        <StatCard
          title="井口完好率"
          value={(stats.integrityRateAvg ?? mockStats.integrityRateAvg).toFixed(1)}
          unit="%"
          change={stats.integrityRateChange ?? mockStats.integrityRateChange}
          icon={<Gauge size={24} />}
          glowColor="green"
        />
        <StatCard
          title="储罐平均液位"
          value={(stats.avgTankLevel ?? mockStats.avgTankLevel).toFixed(1)}
          unit="%"
          change={stats.avgTankLevelChange ?? mockStats.avgTankLevelChange}
          icon={<Droplets size={24} />}
          glowColor="cyan"
        />
        <StatCard
          title="运行中设备数"
          value={stats.runningEquipment ?? mockStats.runningEquipment}
          unit="台"
          change={stats.runningEquipmentChange ?? mockStats.runningEquipmentChange}
          icon={<Cpu size={24} />}
          glowColor="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-oil-panel rounded-xl border border-oil-accent/20 p-5 shadow-glow-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">区块产量对比</h3>
            <div className="flex gap-1 bg-oil-panel-light rounded-lg p-1">
              {(['daily', 'monthly', 'yearly'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setProductionType(type)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    productionType === type
                      ? 'bg-oil-accent text-white shadow-glow-blue'
                      : 'text-oil-text-muted hover:text-white'
                  }`}
                >
                  {prodLabels[type]}
                </button>
              ))}
            </div>
          </div>
          <ReactECharts option={blockProductionOption} style={{ height: 280 }} />
        </div>

        <div className="bg-oil-panel rounded-xl border border-oil-green/20 p-5 shadow-glow-green">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">各区块井口完好率</h3>
          </div>
          <ReactECharts option={integrityRingOption} style={{ height: 280 }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-oil-panel rounded-xl border border-oil-cyan/20 p-5 shadow-glow-cyan">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">储罐液位监控</h3>
            <div className="flex items-center gap-3 text-xs text-oil-text-muted">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-oil-red" />低阈值</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-oil-yellow" />高阈值</span>
            </div>
          </div>
          <ReactECharts option={tankLevelOption} style={{ height: 320 }} />
        </div>

        <div className="lg:col-span-2 bg-oil-panel rounded-xl border border-oil-purple/20 p-5 shadow-glow-purple">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">采油实时数据看板</h3>
            <div className="relative">
              <button
                onClick={() => setWellDropdown(!wellDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-oil-panel-light rounded-lg border border-oil-accent/30 hover:border-oil-accent/60 transition-all text-sm"
              >
                <span>{selectedWell.name}</span>
                <ChevronDown size={14} className={`text-oil-text-muted transition-transform ${wellDropdown ? 'rotate-180' : ''}`} />
              </button>
              {wellDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-oil-panel border border-oil-accent/30 rounded-lg shadow-glow-blue overflow-hidden z-10">
                  {(stats.wells || mockStats.wells).map(w => (
                    <button
                      key={w.id}
                      onClick={() => { setSelectedWellId(w.id); setWellDropdown(false); }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        selectedWellId === w.id ? 'bg-oil-accent/20 text-oil-accent border-l-2 border-oil-accent' : 'hover:bg-oil-panel-light text-oil-text'
                      }`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ReactECharts option={pressureGaugeOption} style={{ height: 280 }} />
            <ReactECharts option={temperatureGaugeOption} style={{ height: 280 }} />
          </div>
        </div>
      </div>

      <div>
        <AlertTimeline alerts={stats.alerts || mockStats.alerts} maxHeight="420px" />
      </div>
    </div>
  );
}
