import { useState, useEffect } from 'react';
import {
  Cylinder,
  Truck,
  Map as MapIcon,
  AlertTriangle,
  Clock,
  Repeat,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader,
  MapPin,
  Fuel,
  Route,
  ArrowRight,
  Zap,
} from 'lucide-react';
import DataTable, { type Column } from '@/components/DataTable';
import { useUserStore } from '@/store/userStore';
import http from '@/utils/request';
import type { Tank, Truck as TruckType, TransportStatus } from '@/types';

interface TankRow extends Tank {
  blockName: string;
}

interface TruckRow extends TruckType {
  driverPhone: string;
}

interface TransportOrder {
  id: string;
  code: string;
  tankName: string;
  truckPlate: string;
  destination: string;
  origin: string;
  quantity: number;
  productType: string;
  status: TransportStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  dispatchedAt?: string;
  estimatedArrivalAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  deadline?: string;
  reassigned?: boolean;
  reassignedAt?: string;
  progress: number;
  routePoints: { x: number; y: number }[];
}

const TRANSPORT_TIMEOUT_HOURS = 2;

const mockTanks: TankRow[] = [
  { id: 'T001', name: 'T-101', code: 'TK-CR-101', blockId: 'A', blockName: 'A区', capacity: 5000, currentLevel: 3600, temperature: 32.4, productType: 'crude_oil', status: 'normal', lastInspectionAt: '2026-06-10' },
  { id: 'T002', name: 'T-102', code: 'TK-CR-102', blockId: 'A', blockName: 'A区', capacity: 5000, currentLevel: 2900, temperature: 31.8, productType: 'crude_oil', status: 'normal', lastInspectionAt: '2026-06-08' },
  { id: 'T003', name: 'T-201', code: 'TK-RF-201', blockId: 'B', blockName: 'B区', capacity: 3000, currentLevel: 2640, temperature: 28.6, productType: 'gasoline', status: 'normal', lastInspectionAt: '2026-06-12' },
  { id: 'T004', name: 'T-202', code: 'TK-RF-202', blockId: 'B', blockName: 'B区', capacity: 3000, currentLevel: 360, temperature: 26.2, productType: 'gasoline', status: 'maintenance', lastInspectionAt: '2026-06-15' },
  { id: 'T005', name: 'T-301', code: 'TK-DS-301', blockId: 'C', blockName: 'C区', capacity: 2000, currentLevel: 900, temperature: 27.1, productType: 'diesel', status: 'normal', lastInspectionAt: '2026-06-05' },
  { id: 'T006', name: 'T-302', code: 'TK-DS-302', blockId: 'C', blockName: 'C区', capacity: 2000, currentLevel: 1260, temperature: 26.8, productType: 'diesel', status: 'normal', lastInspectionAt: '2026-06-14' },
  { id: 'T007', name: 'T-401', code: 'TK-CR-401', blockId: 'D', blockName: 'D区', capacity: 4000, currentLevel: 2480, temperature: 33.2, productType: 'crude_oil', status: 'cleaning', lastInspectionAt: '2026-06-01' },
];

const mockTrucks: TruckRow[] = [
  { id: 'TR001', plate: '辽A·12345', driverName: '王师傅', driverPhone: '138****1234', capacity: 30, currentLoad: 28, status: 'in_use', blockId: 'A', lastMaintenanceAt: '2026-06-10' },
  { id: 'TR002', plate: '辽A·23456', driverName: '李师傅', driverPhone: '139****2345', capacity: 30, currentLoad: 0, status: 'idle', blockId: 'B', lastMaintenanceAt: '2026-06-12' },
  { id: 'TR003', plate: '辽A·34567', driverName: '张师傅', driverPhone: '137****3456', capacity: 25, currentLoad: 25, status: 'in_use', blockId: 'C', lastMaintenanceAt: '2026-06-08' },
  { id: 'TR004', plate: '辽A·45678', driverName: '赵师傅', driverPhone: '136****4567', capacity: 35, currentLoad: 0, status: 'maintenance', blockId: 'A', lastMaintenanceAt: '2026-06-17' },
  { id: 'TR005', plate: '辽A·56789', driverName: '钱师傅', driverPhone: '135****5678', capacity: 30, currentLoad: 30, status: 'in_use', blockId: 'D', lastMaintenanceAt: '2026-06-11' },
  { id: 'TR006', plate: '辽A·67890', driverName: '孙师傅', driverPhone: '134****6789', capacity: 25, currentLoad: 0, status: 'idle', blockId: 'B', lastMaintenanceAt: '2026-06-05' },
];

const mockOrders: TransportOrder[] = [
  {
    id: 'TO001', code: 'YS-20260617-001', tankName: 'T-101', truckPlate: '辽A·12345', origin: 'A区原油库', destination: '中央炼油厂',
    quantity: 28, productType: '原油', status: 'in_transit', priority: 'high', progress: 65,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    dispatchedAt: new Date(Date.now() - 4.5 * 3600000).toISOString(),
    estimatedArrivalAt: new Date(Date.now() + 1.5 * 3600000).toISOString(),
    deadline: new Date(Date.now() + 2 * 3600000).toISOString(),
    routePoints: [{ x: 15, y: 70 }, { x: 35, y: 55 }, { x: 55, y: 40 }, { x: 78, y: 30 }],
  },
  {
    id: 'TO002', code: 'YS-20260617-002', tankName: 'T-301', truckPlate: '辽A·34567', origin: 'C区柴油库', destination: '北区加油站',
    quantity: 25, productType: '柴油', status: 'in_transit', priority: 'medium', progress: 25,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    dispatchedAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
    estimatedArrivalAt: new Date(Date.now() - 1.8 * 3600000).toISOString(),
    deadline: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    routePoints: [{ x: 80, y: 65 }, { x: 65, y: 55 }, { x: 45, y: 68 }],
  },
  {
    id: 'TO003', code: 'YS-20260617-003', tankName: 'T-201', truckPlate: '辽A·56789', origin: 'B区汽油库', destination: '东区配送中心',
    quantity: 30, productType: '汽油', status: 'dispatched', priority: 'high', progress: 5,
    createdAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    dispatchedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    estimatedArrivalAt: new Date(Date.now() + 3 * 3600000).toISOString(),
    deadline: new Date(Date.now() + 3.5 * 3600000).toISOString(),
    routePoints: [{ x: 50, y: 20 }, { x: 60, y: 35 }, { x: 85, y: 50 }],
  },
  {
    id: 'TO004', code: 'YS-20260616-008', tankName: 'T-102', truckPlate: '辽A·23456', origin: 'A区原油库', destination: '中央炼油厂',
    quantity: 26, productType: '原油', status: 'completed', priority: 'medium', progress: 100,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    dispatchedAt: new Date(Date.now() - 11 * 3600000).toISOString(),
    arrivedAt: new Date(Date.now() - 7 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 6.8 * 3600000).toISOString(),
    routePoints: [{ x: 15, y: 70 }, { x: 35, y: 55 }, { x: 55, y: 40 }, { x: 78, y: 30 }],
  },
  {
    id: 'TO005', code: 'YS-20260617-004', tankName: 'T-302', truckPlate: '辽A·67890', origin: 'C区柴油库', destination: '南区物流园',
    quantity: 20, productType: '柴油', status: 'pending', priority: 'low', progress: 0,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    estimatedArrivalAt: new Date(Date.now() + 6 * 3600000).toISOString(),
    deadline: new Date(Date.now() + 7 * 3600000).toISOString(),
    routePoints: [{ x: 80, y: 65 }, { x: 60, y: 75 }, { x: 30, y: 80 }],
  },
];

const productTypeNames: Record<string, string> = {
  crude_oil: '原油', gasoline: '汽油', diesel: '柴油', kerosene: '煤油', other: '其他',
};

const tankStatusStyles = {
  normal: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '正常' },
  maintenance: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '维护中' },
  cleaning: { bg: 'bg-oil-cyan/20', text: 'text-oil-cyan', border: 'border-oil-cyan/50', label: '清罐' },
};

const truckStatusStyles = {
  idle: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '空闲' },
  in_use: { bg: 'bg-oil-accent/20', text: 'text-oil-accent', border: 'border-oil-accent/50', label: '运输中' },
  maintenance: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '保养' },
};

const transportStatusStyles: Record<TransportStatus, { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
  pending: { bg: 'bg-oil-text-muted/20', text: 'text-oil-text-muted', border: 'border-oil-text-muted/50', label: '待派车', icon: <Clock size={12} /> },
  dispatched: { bg: 'bg-oil-cyan/20', text: 'text-oil-cyan', border: 'border-oil-cyan/50', label: '已派车', icon: <Truck size={12} /> },
  in_transit: { bg: 'bg-oil-accent/20', text: 'text-oil-accent', border: 'border-oil-accent/50', label: '运输中', icon: <Loader size={12} className="animate-spin" /> },
  arrived: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '已到达', icon: <CheckCircle size={12} /> },
  completed: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '已完成', icon: <CheckCircle size={12} /> },
};

const priorityStyles = {
  low: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '普通' },
  medium: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '优先' },
  high: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '紧急' },
};

export default function Storage() {
  const { user } = useUserStore();
  const [tanks] = useState<TankRow[]>(mockTanks);
  const [trucks] = useState<TruckRow[]>(mockTrucks);
  const [orders, setOrders] = useState<TransportOrder[]>(mockOrders);
  const [, force] = useState(0);

  useEffect(() => {
    try { http.get('/storage/orders'); } catch {}
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setOrders(prev => prev.map(o => {
        if (o.status === 'in_transit' && o.estimatedArrivalAt) {
          const overtime = Date.now() - new Date(o.estimatedArrivalAt).getTime();
          if (overtime > TRANSPORT_TIMEOUT_HOURS * 3600000 && !o.reassigned) {
            return { ...o, reassigned: true, reassignedAt: new Date().toISOString(), status: 'in_transit' };
          }
        }
        return o;
      }));
      force(n => n + 1);
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const isOverdue = (o: TransportOrder) => {
    if (!o.estimatedArrivalAt) return false;
    return Date.now() - new Date(o.estimatedArrivalAt).getTime() > TRANSPORT_TIMEOUT_HOURS * 3600000;
  };

  const tankColumns: Column<TankRow>[] = [
    { key: 'code', title: '编号', width: '110px' },
    { key: 'name', title: '储罐名', width: '90px', render: r => <span className="text-white font-medium">{r.name}</span> },
    { key: 'blockName', title: '所属区', width: '70px' },
    { key: 'productType', title: '油品', width: '80px', render: r => <span className="px-2 py-0.5 rounded bg-oil-purple/15 text-oil-purple text-xs border border-oil-purple/30">{productTypeNames[r.productType]}</span> },
    { key: 'capacity', title: '容量', align: 'right', width: '90px', render: r => <span className="text-oil-text-muted">{r.capacity}m³</span> },
    { key: 'level', title: '当前液位', width: '180px', render: r => {
      const pct = (r.currentLevel / r.capacity) * 100;
      const color = pct > 85 ? 'bg-oil-red' : pct < 15 ? 'bg-oil-yellow' : 'bg-gradient-to-r from-oil-cyan to-oil-accent';
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2.5 rounded-full bg-oil-panel-light overflow-hidden">
            <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-xs font-semibold w-12 text-right ${pct > 85 ? 'text-oil-red' : pct < 15 ? 'text-oil-yellow' : 'text-white'}`}>{pct.toFixed(0)}%</span>
        </div>
      );
    }},
    { key: 'temperature', title: '温度', align: 'right', width: '80px', render: r => <span>{r.temperature}℃</span> },
    { key: 'status', title: '状态', width: '90px', render: r => { const s = tankStatusStyles[r.status]; return <span className={`px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>; } },
    { key: 'lastInspectionAt', title: '最近检测', width: '110px' },
  ];

  const truckColumns: Column<TruckRow>[] = [
    { key: 'plate', title: '车牌号', width: '110px', render: r => <span className="text-white font-mono font-medium">{r.plate}</span> },
    { key: 'driverName', title: '司机', width: '80px' },
    { key: 'driverPhone', title: '联系电话', width: '120px' },
    { key: 'capacity', title: '载重', align: 'right', width: '80px', render: r => <span>{r.capacity}吨</span> },
    { key: 'currentLoad', title: '当前载货', align: 'right', width: '100px', render: r => (
      <div className="flex items-center justify-end gap-2">
        <span className={`${r.currentLoad > 0 ? 'text-oil-accent font-semibold' : 'text-oil-text-muted'}`}>{r.currentLoad}吨</span>
      </div>
    )},
    { key: 'status', title: '状态', width: '90px', render: r => { const s = truckStatusStyles[r.status]; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{r.status === 'in_use' && <span className="w-1.5 h-1.5 rounded-full bg-oil-accent animate-pulse-slow" />}{s.label}</span>; } },
    { key: 'lastMaintenanceAt', title: '上次保养', width: '110px' },
  ];

  const canReassign = user && ['hq_admin', 'storage_manager', 'block_manager', 'supply_manager'].includes(user.role);

  const orderColumns: Column<TransportOrder>[] = [
    { key: 'code', title: '单号', width: '150px' },
    { key: 'route', title: '路线', width: '220px', render: r => (
      <div className="flex items-center gap-1.5 text-xs">
        <MapPin size={11} className="text-oil-green flex-shrink-0" />
        <span className="text-white truncate max-w-[60px]">{r.origin}</span>
        <ArrowRight size={11} className="text-oil-accent flex-shrink-0" />
        <MapPin size={11} className="text-oil-red flex-shrink-0" />
        <span className="text-white truncate max-w-[60px]">{r.destination}</span>
      </div>
    )},
    { key: 'truckPlate', title: '车辆', width: '110px', render: r => <span className="font-mono text-xs">{r.truckPlate}</span> },
    { key: 'productType', title: '油品', width: '60px' },
    { key: 'quantity', title: '数量', align: 'right', width: '80px', render: r => <span className="text-white">{r.quantity}吨</span> },
    { key: 'priority', title: '优先级', width: '70px', render: r => { const s = priorityStyles[r.priority]; return <span className={`px-2 py-0.5 rounded text-xs border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>; } },
    { key: 'progress', title: '进度', width: '120px', render: r => (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-oil-panel-light overflow-hidden">
          <div className="h-full bg-gradient-to-r from-oil-cyan to-oil-accent transition-all" style={{ width: `${r.progress}%` }} />
        </div>
        <span className="text-xs text-oil-text-muted w-8 text-right">{r.progress}%</span>
      </div>
    )},
    { key: 'status', title: '状态', width: '90px', render: r => {
      const s = transportStatusStyles[r.status];
      const overdue = isOverdue(r);
      return (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${overdue ? 'bg-oil-red/20 text-oil-red border-oil-red/60 animate-pulse' : `${s.bg} ${s.text} ${s.border}`}`}>
            {overdue ? <XCircle size={12} /> : s.icon}
            {overdue ? '超时待转' : s.label}
          </span>
          {r.reassigned && <span className="text-[10px] text-oil-purple flex items-center gap-0.5"><Repeat size={9} />已转派</span>}
        </div>
      );
    }},
    { key: 'action', title: '操作', width: '100px', align: 'center', render: r => {
      const overdue = isOverdue(r);
      return (
        <div className="flex items-center justify-center gap-2">
          {(overdue || r.status === 'pending') && canReassign && (
            <button
              onClick={() => setOrders(prev => prev.map(x => x.id === r.id ? { ...x, reassigned: true, reassignedAt: new Date().toISOString(), status: 'dispatched' as TransportStatus } : x))}
              className="px-3 py-1 rounded text-xs bg-oil-purple/20 text-oil-purple border border-oil-purple/50 hover:bg-oil-purple/30 hover:shadow-glow-purple transition-all flex items-center gap-1"
            >
              <Repeat size={12} /> 转派
            </button>
          )}
          <button className="px-2 py-1 rounded text-xs border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 transition-all">
            <ChevronRight size={12} />
          </button>
        </div>
      );
    }},
  ];

  const getTruckCurrentPos = (order: TransportOrder) => {
    if (order.status === 'pending' || order.status === 'completed') return null;
    const pts = order.routePoints;
    if (pts.length < 2) return pts[0];
    const prog = order.progress / 100;
    const totalSegs = pts.length - 1;
    const segIdx = Math.min(Math.floor(prog * totalSegs), totalSegs - 1);
    const segProg = (prog * totalSegs) - segIdx;
    return {
      x: pts[segIdx].x + (pts[segIdx + 1].x - pts[segIdx].x) * segProg,
      y: pts[segIdx].y + (pts[segIdx + 1].y - pts[segIdx].y) * segProg,
    };
  };

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">油品储运</h2>
        <p className="text-oil-text-muted">调度地图 · 储罐管理 · 运输订单 · 罐车管理</p>
      </div>

      <div className="bg-oil-panel rounded-xl border border-oil-accent/20 p-5 shadow-glow-blue overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <MapIcon className="text-oil-accent" size={20} /> 油品运输调度地图
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-oil-green border border-white shadow-glow-green" /> 起点(油库)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-oil-red border border-white shadow-glow-red" /> 终点(目的地)</div>
            <div className="flex items-center gap-1.5"><span className="relative flex items-center justify-center"><Truck size={12} className="text-white bg-oil-accent rounded p-0.5" /><span className="absolute inset-0 rounded-full animate-ping bg-oil-accent/40" /></span> 罐车位置</div>
            <div className="flex items-center gap-1.5"><span className="w-8 h-0.5 border-t-2 border-dashed border-oil-accent" /> 运输路线</div>
          </div>
        </div>

        <div className="relative h-80 rounded-lg overflow-hidden border border-oil-accent/30 bg-oil-bg">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="map-grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="0.2" />
              </pattern>
              <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#map-grid)" />
            <path d="M 0,40 Q 25,35 50,45 T 100,40" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="4" />
            <path d="M 40,0 Q 38,30 45,50 T 55,100" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="4" />
            <rect x="5" y="60" width="18" height="20" rx="2" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.25)" />
            <rect x="42" y="10" width="16" height="16" rx="2" fill="rgba(16,185,129,0.06)" stroke="rgba(16,185,129,0.2)" />
            <rect x="72" y="55" width="22" height="18" rx="2" fill="rgba(139,92,246,0.06)" stroke="rgba(139,92,246,0.2)" />
            <text x="14" y="72" fontSize="3" fill="#64748B" textAnchor="middle">A区油库</text>
            <text x="50" y="19" fontSize="3" fill="#64748B" textAnchor="middle">中心炼厂</text>
            <text x="83" y="66" fontSize="3" fill="#64748B" textAnchor="middle">C区库区</text>
          </svg>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {orders.filter(o => o.status !== 'completed' && o.status !== 'pending').map(o => {
              const pts = o.routePoints;
              if (pts.length < 2) return null;
              const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
              const overdue = isOverdue(o);
              return (
                <g key={o.id}>
                  <path d={pathD} fill="none" stroke={overdue ? '#EF4444' : 'url(#route-grad)'} strokeWidth="0.6" strokeDasharray="2,1.5" opacity="0.9">
                    <animate attributeName="stroke-dashoffset" from="0" to="-7" dur="1.5s" repeatCount="indefinite" />
                  </path>
                  <circle cx={pts[0].x} cy={pts[0].y} r="1.5" fill="#10B981" stroke="#fff" strokeWidth="0.5" />
                  <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="1.5" fill="#EF4444" stroke="#fff" strokeWidth="0.5" />
                </g>
              );
            })}
          </svg>

          {orders.filter(o => o.status !== 'completed' && o.status !== 'pending').map(o => {
            const pos = getTruckCurrentPos(o);
            if (!pos) return null;
            const overdue = isOverdue(o);
            return (
              <div
                key={`truck-${o.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className={`relative`}>
                  <div className={`absolute inset-0 -m-2 rounded-full ${overdue ? 'bg-oil-red/30 animate-ping' : 'bg-oil-accent/30 animate-ping'}`} />
                  <div className={`relative w-7 h-7 rounded-full flex items-center justify-center ${overdue ? 'bg-oil-red shadow-glow-red' : 'bg-oil-accent shadow-glow-blue'} border-2 border-white`}>
                    <Truck size={12} className="text-white" />
                  </div>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap bg-oil-panel/95 border border-oil-accent/40 rounded px-2 py-1 backdrop-blur-sm">
                  <div className="text-[10px] font-mono text-white font-semibold">{o.truckPlate}</div>
                  <div className="text-[9px] text-oil-text-muted">{o.progress}% · {o.productType}</div>
                  {overdue && <div className="text-[9px] text-oil-red font-bold animate-pulse">⚠ 超时</div>}
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-3 left-3 bg-oil-panel/90 rounded-lg border border-oil-accent/30 p-3 backdrop-blur-sm text-xs space-y-1.5">
            <div className="text-oil-text-muted mb-2 flex items-center gap-1"><Zap size={11} className="text-oil-accent" /> 实时统计</div>
            <div className="flex justify-between gap-6"><span className="text-oil-text-muted">运输中</span><span className="text-oil-accent font-semibold">{orders.filter(o => o.status === 'in_transit').length} 单</span></div>
            <div className="flex justify-between gap-6"><span className="text-oil-text-muted">今日完成</span><span className="text-oil-green font-semibold">{orders.filter(o => o.status === 'completed').length} 单</span></div>
            <div className="flex justify-between gap-6"><span className="text-oil-text-muted">超时预警</span><span className={`font-semibold ${orders.filter(o => isOverdue(o)).length > 0 ? 'text-oil-red animate-pulse' : 'text-oil-text-muted'}`}>{orders.filter(o => isOverdue(o)).length} 单</span></div>
          </div>

          <div className="absolute top-3 right-3 bg-oil-panel/90 rounded-lg border border-oil-accent/30 p-3 backdrop-blur-sm max-w-[280px]">
            <div className="text-oil-text-muted text-xs mb-2 flex items-center gap-1"><Route size={11} className="text-oil-cyan" /> 活跃运输单</div>
            <div className="space-y-1.5">
              {orders.filter(o => o.status === 'in_transit' || o.status === 'dispatched').map(o => {
                const overdue = isOverdue(o);
                return (
                  <div key={o.id} className={`flex items-center gap-2 p-1.5 rounded text-xs border ${overdue ? 'bg-oil-red/10 border-oil-red/30' : 'bg-oil-panel-light/50 border-oil-accent/20'}`}>
                    <span className={`px-1.5 py-0.5 rounded font-mono ${overdue ? 'bg-oil-red/20 text-oil-red' : 'bg-oil-accent/20 text-oil-accent'}`}>{o.code.slice(-3)}</span>
                    <span className="text-white truncate flex-1">{o.origin}→{o.destination.slice(0, 4)}</span>
                    <span className={`font-semibold ${overdue ? 'text-oil-red' : 'text-oil-green'}`}>{o.progress}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <DataTable<TankRow>
            columns={tankColumns}
            data={tanks}
            title={<span className="flex items-center gap-2"><Cylinder className="text-oil-cyan" size={16} /> 储罐列表</span> as any}
            rowKey="id"
            pageSize={6}
            showSearch
            searchPlaceholder="搜索储罐..."
            searchKeys={['name', 'code', 'blockName']}
          />
        </div>

        <div className="lg:col-span-1">
          <DataTable<TransportOrder>
            columns={orderColumns}
            data={orders}
            title={<span className="flex items-center gap-2"><Fuel className="text-oil-yellow" size={16} /> 运输订单</span> as any}
            rowKey="id"
            pageSize={6}
            showSearch
            searchPlaceholder="搜索单号/路线..."
            searchKeys={['code', 'origin', 'destination', 'truckPlate']}
          />
        </div>

        <div className="lg:col-span-1">
          <DataTable<TruckRow>
            columns={truckColumns}
            data={trucks}
            title={<span className="flex items-center gap-2"><Truck className="text-oil-purple" size={16} /> 罐车列表</span> as any}
            rowKey="id"
            pageSize={6}
            showSearch
            searchPlaceholder="搜索车牌号/司机..."
            searchKeys={['plate', 'driverName']}
          />
        </div>
      </div>
    </div>
  );
}
