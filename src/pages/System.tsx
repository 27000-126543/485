import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Settings,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Search,
  Save,
  RotateCcw,
  Clock,
  AlertTriangle,
  Gauge,
  UserPlus,
  Lock,
  Unlock,
  Filter,
} from 'lucide-react';
import DataTable, { type Column } from '@/components/DataTable';
import { useUserStore } from '@/store/userStore';
import http from '@/utils/request';
import type { UserRole, ModuleName } from '@/types';
import { getAllRoles, getRoleDisplayName, getAllModules, getModuleDisplayName, rolePermissionMap } from '@/utils/permissions';

type SysTab = 'users' | 'permissions' | 'rules';

interface SystemUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  blockName?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt?: string;
}

const mockUsers: SystemUser[] = [
  { id: 'U001', username: 'admin', name: '张管理', email: 'admin@oilfield.com', phone: '13800000001', role: 'hq_admin', blockName: '全部', status: 'active', createdAt: '2024-01-01', lastLoginAt: new Date().toISOString() },
  { id: 'U002', username: 'geologist', name: '李地质', email: 'li.geology@oilfield.com', phone: '13800000002', role: 'geologist', blockName: 'A区', status: 'active', createdAt: '2024-02-15', lastLoginAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'U003', username: 'drill_mgr', name: '王钻井', email: 'wang.drill@oilfield.com', phone: '13800000003', role: 'supply_manager', blockName: 'B区', status: 'active', createdAt: '2024-03-10', lastLoginAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'U004', username: 'block_a', name: '陈主管', email: 'chen.a@oilfield.com', phone: '13800000004', role: 'block_manager', blockName: 'A区', status: 'active', createdAt: '2024-03-22', lastLoginAt: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: 'U005', username: 'chief_eng', name: '赵总工', email: 'zhao.eng@oilfield.com', phone: '13800000005', role: 'chief_engineer', blockName: '全部', status: 'active', createdAt: '2024-01-15', lastLoginAt: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: 'U006', username: 'oil_worker01', name: '刘采油', email: 'liu.worker@oilfield.com', phone: '13800000006', role: 'oil_worker', blockName: 'C区', status: 'active', createdAt: '2024-06-01', lastLoginAt: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'U007', username: 'team_lead_b', name: '周班长', email: 'zhou.tl@oilfield.com', phone: '13800000007', role: 'team_leader', blockName: 'B区', status: 'active', createdAt: '2024-05-18', lastLoginAt: new Date(Date.now() - 1.5 * 3600000).toISOString() },
  { id: 'U008', username: 'disabled', name: '临时员工', email: 'tmp@oilfield.com', phone: '13800000099', role: 'oil_worker', blockName: 'D区', status: 'disabled', createdAt: '2025-11-01' },
];

interface RuleConfig {
  approvalTimeoutHours: number;
  workOrderEscalateMinutes: number;
  transportOverdueHours: number;
  repairEscalateHours: number;
  safetyCh4Warning: number;
  safetyH2SWarning: number;
  safetyTempWarning: number;
  tankLowLevelThreshold: number;
  tankHighLevelThreshold: number;
  equipmentMaintainAdvanceDays: number;
}

const DEFAULT_RULES: RuleConfig = {
  approvalTimeoutHours: 24,
  workOrderEscalateMinutes: 15,
  transportOverdueHours: 2,
  repairEscalateHours: 2,
  safetyCh4Warning: 20,
  safetyH2SWarning: 20,
  safetyTempWarning: 65,
  tankLowLevelThreshold: 15,
  tankHighLevelThreshold: 90,
  equipmentMaintainAdvanceDays: 15,
};

const ROLE_COLORS: Record<UserRole, string> = {
  hq_admin: 'bg-oil-purple/20 text-oil-purple border-oil-purple/50',
  chief_engineer: 'bg-oil-cyan/20 text-oil-cyan border-oil-cyan/50',
  block_manager: 'bg-oil-accent/20 text-oil-accent border-oil-accent/50',
  geologist: 'bg-oil-green/20 text-oil-green border-oil-green/50',
  supply_manager: 'bg-oil-yellow/20 text-oil-yellow border-oil-yellow/50',
  team_leader: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/50',
  oil_worker: 'bg-oil-text-muted/20 text-oil-text-muted border-oil-text-muted/50',
  drilling_engineer: 'bg-sky-500/20 text-sky-400 border-sky-400/50',
  storage_manager: 'bg-teal-500/20 text-teal-400 border-teal-400/50',
  maintenance_engineer: 'bg-indigo-500/20 text-indigo-400 border-indigo-400/50',
  safety_officer: 'bg-rose-500/20 text-rose-400 border-rose-400/50',
};

type PermMatrix = Record<UserRole, Record<ModuleName, { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean }>>;

function buildInitialMatrix(): PermMatrix {
  const matrix: any = {};
  getAllRoles().forEach(role => {
    matrix[role] = {};
    getAllModules().forEach(mod => {
      const actions = rolePermissionMap[role]?.[mod] || [];
      matrix[role][mod] = {
        view: actions.includes('view'),
        create: actions.includes('create'),
        edit: actions.includes('edit'),
        delete: actions.includes('delete'),
        approve: actions.includes('approve'),
      };
    });
  });
  return matrix;
}

export default function System() {
  const { user } = useUserStore();
  const [tab, setTab] = useState<SysTab>('users');
  const [users, setUsers] = useState<SystemUser[]>(mockUsers);
  const [userModal, setUserModal] = useState<{ mode: 'add' | 'edit'; user?: SystemUser } | null>(null);
  const [formData, setFormData] = useState<Partial<SystemUser>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  const [permMatrix, setPermMatrix] = useState<PermMatrix>(buildInitialMatrix());
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const [rules, setRules] = useState<RuleConfig>(DEFAULT_RULES);
  const [rulesChanged, setRulesChanged] = useState(false);

  const canEdit = user && (user.role === 'hq_admin');
  const canView = user && ['hq_admin'].includes(user.role as string);

  useEffect(() => {
    try { http.get('/system/users'); } catch {}
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const openAdd = () => {
    setFormData({ status: 'active', role: 'oil_worker' });
    setUserModal({ mode: 'add' });
  };

  const openEdit = (u: SystemUser) => {
    setFormData({ ...u });
    setUserModal({ mode: 'edit', user: u });
  };

  const submitUser = () => {
    if (!formData.name || !formData.username || !formData.role) {
      setToast({ type: 'error', msg: '请填写必填字段' });
      return;
    }
    if (userModal?.mode === 'add') {
      const nu: SystemUser = {
        id: 'U' + String(users.length + 100).padStart(3, '0'),
        username: formData.username,
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone || '',
        role: formData.role,
        blockName: formData.blockName || '全部',
        status: formData.status || 'active',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setUsers(prev => [...prev, nu]);
      setToast({ type: 'success', msg: `用户 ${nu.name} 已添加` });
    } else if (userModal?.mode === 'edit' && userModal.user) {
      setUsers(prev => prev.map(u => u.id === userModal.user!.id ? { ...u, ...formData } as SystemUser : u));
      setToast({ type: 'success', msg: '用户信息已更新' });
    }
    setUserModal(null);
    setFormData({});
  };

  const deleteUser = (id: string, name: string) => {
    if (!confirm(`确定删除用户 ${name}?`)) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    setToast({ type: 'info', msg: `用户 ${name} 已删除` });
  };

  const togglePerm = (role: UserRole, mod: ModuleName, action: 'view' | 'create' | 'edit' | 'delete' | 'approve') => {
    if (!canEdit) return;
    setPermMatrix(prev => {
      const next: any = JSON.parse(JSON.stringify(prev));
      const cur = next[role][mod][action];
      next[role][mod][action] = !cur;
      if (!cur && action !== 'view') next[role][mod].view = true;
      if (cur && action === 'view') {
        next[role][mod].create = false;
        next[role][mod].edit = false;
        next[role][mod].delete = false;
        next[role][mod].approve = false;
      }
      return next;
    });
  };

  const savePerm = () => {
    setToast({ type: 'success', msg: '权限矩阵已保存（前端模拟）' });
  };

  const userColumns: Column<SystemUser>[] = [
    { key: 'username', title: '账号', width: '100px', render: r => <span className="text-oil-cyan font-mono text-sm">{r.username}</span> },
    { key: 'name', title: '姓名', width: '90px', render: r => <span className="text-white font-medium">{r.name}</span> },
    { key: 'role', title: '角色', width: '110px', render: r => <span className={`px-2 py-0.5 rounded text-xs border ${ROLE_COLORS[r.role]}`}>{getRoleDisplayName(r.role)}</span> },
    { key: 'blockName', title: '所属区块', width: '80px' },
    { key: 'phone', title: '电话', width: '130px', render: r => <span className="text-oil-text-muted text-xs font-mono">{r.phone}</span> },
    { key: 'email', title: '邮箱', width: '180px', render: r => <span className="text-oil-text-muted text-xs">{r.email || '-'}</span> },
    { key: 'status', title: '状态', width: '80px', render: r => <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${r.status === 'active' ? 'bg-oil-green/20 text-oil-green border-oil-green/50' : 'bg-oil-text-muted/20 text-oil-text-muted border-oil-text-muted/50'}`}><span className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-oil-green animate-pulse-slow' : 'bg-oil-text-muted'}`} />{r.status === 'active' ? '启用' : '禁用'}</span> },
    { key: 'lastLoginAt', title: '最近登录', width: '160px', render: r => r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString('zh-CN') : <span className="text-oil-text-muted/50">从未登录</span> },
    { key: 'action', title: '操作', width: '170px', align: 'center', render: r => canEdit ? (
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => openEdit(r)} className="px-3 py-1 rounded text-xs bg-oil-accent/20 text-oil-accent border border-oil-accent/50 hover:bg-oil-accent/30 transition-all flex items-center gap-1"><Pencil size={11} /> 编辑</button>
        <button onClick={() => setUsers(prev => prev.map(x => x.id === r.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x))} className={`px-3 py-1 rounded text-xs border transition-all flex items-center gap-1 ${r.status === 'active' ? 'bg-oil-yellow/20 text-oil-yellow border-oil-yellow/50 hover:bg-oil-yellow/30' : 'bg-oil-green/20 text-oil-green border-oil-green/50 hover:bg-oil-green/30'}`}>
          {r.status === 'active' ? <><Lock size={11} /> 禁用</> : <><Unlock size={11} /> 启用</>}
        </button>
        <button onClick={() => deleteUser(r.id, r.name)} className="px-2 py-1 rounded text-xs bg-oil-red/20 text-oil-red border border-oil-red/50 hover:bg-oil-red/30 transition-all"><Trash2 size={11} /></button>
      </div>
    ) : <span className="text-oil-text-muted text-xs">无权限</span> },
  ];

  const tabs: { key: SysTab; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: '用户管理', icon: <Users size={18} /> },
    { key: 'permissions', label: '权限矩阵', icon: <Shield size={18} /> },
    { key: 'rules', label: '规则配置', icon: <Settings size={18} /> },
  ];

  const roles = roleFilter === 'all' ? getAllRoles() : [roleFilter];
  const modules = getAllModules();
  const actionLabels: { key: 'view' | 'create' | 'edit' | 'delete' | 'approve'; label: string; short: string; desc: string }[] = [
    { key: 'view', label: '查看', short: 'V', desc: '查看模块数据' },
    { key: 'create', label: '新增', short: 'C', desc: '创建新记录' },
    { key: 'edit', label: '编辑', short: 'E', desc: '修改已有记录' },
    { key: 'delete', label: '删除', short: 'D', desc: '删除记录' },
    { key: 'approve', label: '审批', short: 'A', desc: '审批流程' },
  ];

  const ruleFields: { key: keyof RuleConfig; label: string; unit: string; type: 'number' | 'text'; desc: string; icon: React.ReactNode; group: string }[] = [
    { key: 'approvalTimeoutHours', label: '审批超时时间', unit: '小时', type: 'number', desc: '审批流程超过此时长自动升级', icon: <Clock size={14} />, group: '流程与工单' },
    { key: 'workOrderEscalateMinutes', label: '工单升级阈值', unit: '分钟', type: 'number', desc: '采油工单未确认超过此时长自动升级', icon: <AlertTriangle size={14} />, group: '流程与工单' },
    { key: 'repairEscalateHours', label: '报修升级阈值', unit: '小时', type: 'number', desc: '报修工单接单后超过此时长未完成自动升级', icon: <AlertTriangle size={14} />, group: '流程与工单' },
    { key: 'transportOverdueHours', label: '运输超时阈值', unit: '小时', type: 'number', desc: '运输订单超此时长自动标红转派', icon: <Clock size={14} />, group: '流程与工单' },
    { key: 'safetyCh4Warning', label: '甲烷预警阈值', unit: '%LEL', type: 'number', desc: '甲烷浓度超此值触发预警', icon: <Gauge size={14} />, group: '安全阈值' },
    { key: 'safetyH2SWarning', label: '硫化氢预警阈值', unit: 'ppm', type: 'number', desc: '硫化氢浓度超此值触发预警', icon: <Gauge size={14} />, group: '安全阈值' },
    { key: 'safetyTempWarning', label: '原油温度预警', unit: '℃', type: 'number', desc: '储罐原油温度超此值预警', icon: <Gauge size={14} />, group: '安全阈值' },
    { key: 'tankLowLevelThreshold', label: '储罐液位低限', unit: '%', type: 'number', desc: '液位低于此百分比标红提醒', icon: <Gauge size={14} />, group: '储运与设备' },
    { key: 'tankHighLevelThreshold', label: '储罐液位高限', unit: '%', type: 'number', desc: '液位高于此百分比标黄预警', icon: <Gauge size={14} />, group: '储运与设备' },
    { key: 'equipmentMaintainAdvanceDays', label: '保养提前提醒', unit: '天', type: 'number', desc: '距下次保养此天数内标黄提醒', icon: <Clock size={14} />, group: '储运与设备' },
  ];

  const groups = Array.from(new Set(ruleFields.map(f => f.group)));

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-24 right-6 z-50 px-5 py-3 rounded-xl shadow-lg border flex items-center gap-2 animate-bounce-in ${toast.type === 'success' ? 'bg-oil-green/15 text-oil-green border-oil-green/50 shadow-glow-green' : toast.type === 'error' ? 'bg-oil-red/15 text-oil-red border-oil-red/50 shadow-glow-red' : 'bg-oil-cyan/15 text-oil-cyan border-oil-cyan/50'}`}>
          {toast.type === 'success' ? <Check size={16} /> : toast.type === 'error' ? <X size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="mb-2 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">系统管理</h2>
          <p className="text-oil-text-muted">用户管理 · 权限配置 · 规则参数设置</p>
        </div>
        {!canView && (
          <div className="px-4 py-2 rounded-xl bg-oil-red/10 border border-oil-red/30 text-oil-red text-sm flex items-center gap-2">
            <Lock size={16} /> 无系统管理权限
          </div>
        )}
      </div>

      <div className="bg-oil-panel rounded-xl border border-oil-accent/20 p-1.5 inline-flex gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === t.key ? 'bg-oil-accent text-white shadow-glow-blue' : 'text-oil-text-muted hover:text-white hover:bg-oil-panel-light'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-oil-text-muted">共 <span className="text-white font-semibold">{users.length}</span> 位用户 · 启用 <span className="text-oil-green font-semibold">{users.filter(u => u.status === 'active').length}</span> 人</div>
            </div>
            {canEdit && (
              <button onClick={openAdd} className="px-4 py-2 rounded-xl bg-oil-accent text-white hover:shadow-glow-blue text-sm flex items-center gap-2">
                <UserPlus size={16} /> 新增用户
              </button>
            )}
          </div>
          <DataTable<SystemUser> columns={userColumns} data={users} title="" rowKey="id" pageSize={8} searchPlaceholder="搜索账号/姓名/电话..." searchKeys={['username', 'name', 'phone', 'email']} />

          {userModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setUserModal(null)}>
              <div className="bg-oil-panel border border-oil-accent/40 rounded-2xl shadow-glow-blue w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-oil-accent/20 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">{userModal.mode === 'add' ? <><Plus size={18} className="text-oil-accent" /> 新增用户</> : <><Pencil size={18} className="text-oil-cyan" /> 编辑用户</>}</h3>
                  <button onClick={() => setUserModal(null)} className="text-oil-text-muted hover:text-white"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs text-oil-text-muted mb-1.5">登录账号<span className="text-oil-red">*</span></label><input value={formData.username || ''} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} disabled={userModal.mode === 'edit'} className="w-full px-3 py-2 rounded-lg bg-oil-panel-light border border-oil-accent/30 text-white focus:outline-none focus:border-oil-accent focus:shadow-glow-blue text-sm disabled:opacity-60" /></div>
                    <div><label className="block text-xs text-oil-text-muted mb-1.5">姓名<span className="text-oil-red">*</span></label><input value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-oil-panel-light border border-oil-accent/30 text-white focus:outline-none focus:border-oil-accent focus:shadow-glow-blue text-sm" /></div>
                  </div>
                  <div><label className="block text-xs text-oil-text-muted mb-1.5">角色<span className="text-oil-red">*</span></label>
                    <select value={formData.role || 'oil_worker'} onChange={e => setFormData(p => ({ ...p, role: e.target.value as UserRole }))} className="w-full px-3 py-2 rounded-lg bg-oil-panel-light border border-oil-accent/30 text-white focus:outline-none focus:border-oil-accent focus:shadow-glow-blue text-sm">
                      {getAllRoles().map(r => <option key={r} value={r}>{getRoleDisplayName(r)}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs text-oil-text-muted mb-1.5">所属区块</label><input value={formData.blockName || ''} onChange={e => setFormData(p => ({ ...p, blockName: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-oil-panel-light border border-oil-accent/30 text-white focus:outline-none focus:border-oil-accent focus:shadow-glow-blue text-sm" /></div>
                    <div><label className="block text-xs text-oil-text-muted mb-1.5">手机号</label><input value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-oil-panel-light border border-oil-accent/30 text-white focus:outline-none focus:border-oil-accent focus:shadow-glow-blue text-sm font-mono" /></div>
                  </div>
                  <div><label className="block text-xs text-oil-text-muted mb-1.5">邮箱</label><input value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} type="email" className="w-full px-3 py-2 rounded-lg bg-oil-panel-light border border-oil-accent/30 text-white focus:outline-none focus:border-oil-accent focus:shadow-glow-blue text-sm" /></div>
                  {userModal.mode === 'edit' && (
                    <div><label className="block text-xs text-oil-text-muted mb-1.5">状态</label>
                      <div className="flex gap-2">
                        {(['active', 'disabled'] as const).map(s => (
                          <button key={s} onClick={() => setFormData(p => ({ ...p, status: s }))} className={`flex-1 py-2 rounded-lg border text-sm transition-all ${formData.status === s ? (s === 'active' ? 'bg-oil-green/20 border-oil-green/60 text-oil-green' : 'bg-oil-text-muted/20 border-oil-text-muted/50 text-oil-text-muted') : 'border-oil-accent/20 text-oil-text-muted hover:border-oil-accent/40'}`}>
                            {s === 'active' ? '启用' : '禁用'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-oil-accent/20 flex justify-end gap-3">
                  <button onClick={() => setUserModal(null)} className="px-5 py-2 rounded-lg border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 text-sm">取消</button>
                  <button onClick={submitUser} className="px-5 py-2 rounded-lg bg-oil-accent text-white hover:shadow-glow-blue text-sm flex items-center gap-1.5"><Save size={14} /> 保存</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'permissions' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Filter size={14} className="text-oil-text-muted" />
              <div className="flex gap-1 bg-oil-panel-light rounded-lg p-1 flex-wrap">
                <button onClick={() => setRoleFilter('all')} className={`px-3 py-1.5 rounded text-xs transition-all ${roleFilter === 'all' ? 'bg-oil-accent text-white shadow-glow-blue' : 'text-oil-text-muted hover:text-white'}`}>全部角色</button>
                {getAllRoles().map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded text-xs transition-all ${roleFilter === r ? 'bg-oil-accent text-white shadow-glow-blue' : 'text-oil-text-muted hover:text-white'}`}>{getRoleDisplayName(r)}</button>
                ))}
              </div>
            </div>
            {canEdit && (
              <button onClick={savePerm} className="px-4 py-2 rounded-xl bg-oil-green text-white hover:shadow-glow-green text-sm flex items-center gap-2">
                <Save size={16} /> 保存权限
              </button>
            )}
          </div>

          <div className="bg-oil-panel rounded-xl border border-oil-accent/30 overflow-hidden shadow-glow-blue">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-oil-text-muted bg-oil-panel-light/50 sticky left-0 z-10 border-b border-r border-oil-accent/20 min-w-[140px]">角色 \ 权限</th>
                    {actionLabels.map(a => (
                      <th key={a.key} className="px-2 py-3 text-center text-xs font-semibold text-oil-text-muted bg-oil-panel-light/50 border-b border-oil-accent/20 min-w-[56px]" title={a.desc}>{a.label}<span className="ml-0.5 text-oil-accent opacity-70">({a.short})</span></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map(mod => (
                    <>
                      <tr key={`mod-${mod}`}>
                        <td colSpan={1 + actionLabels.length} className="px-4 py-2.5 bg-oil-accent/5 border-y border-oil-accent/20 text-sm font-semibold text-oil-accent sticky left-0">{getModuleDisplayName(mod)} <span className="text-[10px] font-normal text-oil-text-muted ml-2">{mod}</span></td>
                      </tr>
                      {roles.map(role => (
                        <tr key={`${mod}-${role}`} className="hover:bg-oil-panel-light/30 border-b border-oil-accent/10">
                          <td className="px-4 py-2.5 text-xs sticky left-0 bg-oil-panel border-r border-oil-accent/20">
                            <span className={`px-2 py-0.5 rounded border ${ROLE_COLORS[role]}`}>{getRoleDisplayName(role)}</span>
                          </td>
                          {actionLabels.map(a => {
                            const checked = permMatrix[role]?.[mod]?.[a.key] || false;
                            return (
                              <td key={a.key} className="px-2 py-2.5 text-center border-r border-oil-accent/10 last:border-r-0">
                                <button onClick={() => togglePerm(role, mod, a.key)} disabled={!canEdit} className={`inline-flex w-6 h-6 rounded-md items-center justify-center transition-all ${checked ? (a.key === 'delete' ? 'bg-oil-red/30 border border-oil-red/60' : a.key === 'approve' ? 'bg-oil-purple/30 border border-oil-purple/60' : a.key === 'view' ? 'bg-oil-green/30 border border-oil-green/60' : a.key === 'create' ? 'bg-oil-accent/30 border border-oil-accent/60' : 'bg-oil-cyan/30 border border-oil-cyan/60') : 'bg-oil-panel-light/50 border border-oil-accent/20 hover:border-oil-accent/40'} ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}>
                                  {checked ? <Check size={12} className={a.key === 'delete' ? 'text-oil-red' : a.key === 'approve' ? 'text-oil-purple' : a.key === 'view' ? 'text-oil-green' : a.key === 'create' ? 'text-oil-accent' : 'text-oil-cyan'} /> : <span className="text-oil-text-muted/30 text-xs">-</span>}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-oil-text-muted">
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-oil-green/30 border border-oil-green/60 flex items-center justify-center"><Check size={8} className="text-oil-green" /></div> 查看权限</div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-oil-accent/30 border border-oil-accent/60 flex items-center justify-center"><Check size={8} className="text-oil-accent" /></div> 新增权限</div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-oil-cyan/30 border border-oil-cyan/60 flex items-center justify-center"><Check size={8} className="text-oil-cyan" /></div> 编辑权限</div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-oil-red/30 border border-oil-red/60 flex items-center justify-center"><Check size={8} className="text-oil-red" /></div> 删除权限</div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-oil-purple/30 border border-oil-purple/60 flex items-center justify-center"><Check size={8} className="text-oil-purple" /></div> 审批权限</div>
          </div>
        </div>
      )}

      {tab === 'rules' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-oil-text-muted">系统参数将影响所有业务页面的自动逻辑判断（前端模拟）</div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setRules(DEFAULT_RULES); setRulesChanged(true); }} className="px-4 py-2 rounded-xl border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 text-sm flex items-center gap-2"><RotateCcw size={14} /> 恢复默认</button>
              <button onClick={() => { setRulesChanged(true); setToast({ type: 'success', msg: '规则配置已保存（前端模拟）' }); }} disabled={!canEdit} className="px-5 py-2 rounded-xl bg-oil-accent text-white hover:shadow-glow-blue text-sm flex items-center gap-2 disabled:opacity-50"><Save size={14} /> 保存配置</button>
            </div>
          </div>

          <div className="space-y-6">
            {groups.map(group => (
              <div key={group} className="bg-oil-panel rounded-xl border border-oil-accent/30 p-6">
                <h4 className="text-base font-semibold text-oil-accent mb-5 flex items-center gap-2 pb-3 border-b border-oil-accent/20">
                  <Settings size={16} /> {group}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {ruleFields.filter(f => f.group === group).map(field => (
                    <div key={field.key} className="bg-oil-panel-light/50 rounded-xl border border-oil-accent/20 p-4 hover:border-oil-accent/40 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <label className="text-sm text-white font-medium flex items-center gap-1.5">
                          <span className={`w-7 h-7 rounded-lg bg-oil-accent/15 border border-oil-accent/40 text-oil-accent flex items-center justify-center`}>{field.icon}</span>
                          {field.label}
                        </label>
                      </div>
                      <p className="text-xs text-oil-text-muted mb-3 leading-relaxed">{field.desc}</p>
                      <div className="flex items-center gap-2">
                        <input type={field.type} value={Number(rules[field.key])} onChange={e => { setRules(p => ({ ...p, [field.key]: Number(e.target.value) })); setRulesChanged(true); }} disabled={!canEdit} className="flex-1 px-4 py-2.5 rounded-lg bg-oil-panel border border-oil-accent/30 text-white focus:outline-none focus:border-oil-accent focus:shadow-glow-blue text-lg font-mono font-bold disabled:opacity-70" />
                        <span className="text-sm text-oil-cyan px-2 font-medium">{field.unit}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-oil-accent/10 text-[10px] text-oil-text-muted flex items-center justify-between">
                        <span>默认值：{DEFAULT_RULES[field.key]}{field.unit}</span>
                        {rules[field.key] !== DEFAULT_RULES[field.key] && <span className="text-oil-yellow flex items-center gap-1"><AlertTriangle size={9} /> 已修改</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
