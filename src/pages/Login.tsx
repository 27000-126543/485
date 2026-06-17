import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Droplets,
  AlertCircle,
  ShieldCheck,
  Building2,
  Mountain,
  Drill,
  Cylinder,
  Wrench,
  Shield,
  Settings,
} from 'lucide-react';
import { useUserStore, UserRole } from '@/store/userStore';
import http from '@/utils/request';

interface TestAccount {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  icon: React.ReactNode;
  description: string;
}

const testAccounts: TestAccount[] = [
  {
    username: 'hq_admin',
    password: '123456',
    name: '张管理',
    role: 'hq_admin',
    icon: <ShieldCheck size={16} />,
    description: '总部管理员 · 全功能权限',
  },
  {
    username: 'geologist',
    password: '123456',
    name: '李地质',
    role: 'geologist',
    icon: <Mountain size={16} />,
    description: '地质工程师 · 地质勘探模块',
  },
  {
    username: 'drilling',
    password: '123456',
    name: '王钻井',
    role: 'drilling_engineer',
    icon: <Drill size={16} />,
    description: '钻井工程师 · 钻井调度模块',
  },
  {
    username: 'oil_worker',
    password: '123456',
    name: '赵采油',
    role: 'oil_worker',
    icon: <Droplets size={16} />,
    description: '采油工 · 采油监控+安全+设备',
  },
  {
    username: 'storage',
    password: '123456',
    name: '钱储运',
    role: 'storage_manager',
    icon: <Cylinder size={16} />,
    description: '储运管理员 · 油品储运模块',
  },
  {
    username: 'maintenance',
    password: '123456',
    name: '孙运维',
    role: 'maintenance_engineer',
    icon: <Wrench size={16} />,
    description: '设备运维工程师 · 设备+安全模块',
  },
  {
    username: 'safety',
    password: '123456',
    name: '周安全',
    role: 'safety_officer',
    icon: <Shield size={16} />,
    description: '安全员 · 安全环保模块',
  },
];

const roleNames: Partial<Record<UserRole, string>> = {
  hq_admin: '总部管理员',
  block_manager: '区块主管',
  chief_engineer: '总工程师',
  geologist: '地质工程师',
  supply_manager: '物供经理',
  team_leader: '班组长',
  drilling_engineer: '钻井工程师',
  oil_worker: '采油工',
  storage_manager: '储运管理员',
  maintenance_engineer: '设备运维工程师',
  safety_officer: '安全员',
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useUserStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      return;
    }

    setLoading(true);
    try {
      const rawResp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const result = await rawResp.json();

      if (!result.success || !result.data?.token || !result.data?.user) {
        throw new Error(result.error || '账号或密码错误');
      }

      const userData = result.data.user;
      const tokenData = result.data.token;

      login(
        {
          id: userData.id,
          username: userData.username,
          name: userData.name,
          role: userData.role,
          avatar: userData.avatar || '',
          block: userData.blockId || 'all',
        },
        tokenData
      );
      setLoading(false);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '账号或密码错误');
      setLoading(false);
    }
  };

  const handleKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  const fillAccount = (acc: TestAccount) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-oil-bg">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
          <div className="hidden lg:block space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-oil-accent to-oil-cyan flex items-center justify-center shadow-glow-blue">
                <Droplets size={36} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-wide">
                  油田企业综合管理系统
                </h1>
                <p className="text-oil-text-muted mt-1">OilField Integrated Management Platform</p>
              </div>
            </div>

            <p className="text-oil-text text-lg leading-relaxed">
              集<span className="text-oil-accent">地质勘探</span>、<span className="text-oil-cyan">钻井调度</span>、
              <span className="text-oil-green">采油监控</span>、<span className="text-oil-yellow">油品储运</span>、
              <span className="text-oil-purple">设备运维</span>、
              <span className="text-oil-red">安全环保</span>于一体的现代化油田数字化管理平台。
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Drill size={20} />, label: '智能钻井', color: 'oil-cyan' },
                { icon: <Droplets size={20} />, label: '实时监测', color: 'oil-green' },
                { icon: <Building2 size={20} />, label: '区块管理', color: 'oil-yellow' },
                { icon: <Settings size={20} />, label: '流程审批', color: 'oil-purple' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <span className={`text-${item.color}`}>{item.icon}</span>
                  <span className="text-oil-text font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/30">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">账号登录</h2>
              <p className="text-oil-text-muted text-sm">欢迎使用油田综合管理系统</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-oil-red/10 border border-oil-red/30 text-oil-red text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-oil-text-muted mb-2">账号</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-oil-text-muted" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeydown}
                    placeholder="请输入账号"
                    className="w-full pl-12 pr-4 py-3.5 bg-oil-panel/60 border border-oil-accent/30 rounded-xl text-white placeholder:text-oil-text-muted focus:outline-none focus:border-oil-accent focus:shadow-glow-blue transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-oil-text-muted mb-2">密码</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-oil-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeydown}
                    placeholder="请输入密码"
                    className="w-full pl-12 pr-12 py-3.5 bg-oil-panel/60 border border-oil-accent/30 rounded-xl text-white placeholder:text-oil-text-muted focus:outline-none focus:border-oil-accent focus:shadow-glow-blue transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-oil-text-muted hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-oil-text-muted cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded bg-oil-panel border-oil-accent/40 text-oil-accent focus:ring-oil-accent" />
                  记住账号
                </label>
                <a className="text-oil-accent hover:text-oil-accent-hover cursor-pointer">忘记密码?</a>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-oil-accent to-oil-cyan text-white font-semibold rounded-xl shadow-glow-blue hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    登录中...
                  </span>
                ) : (
                  '登 录'
                )}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-oil-text-muted mb-4 flex items-center gap-2">
                <ShieldCheck size={14} />
                测试账号（点击快速填充）：
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {testAccounts.map((acc) => (
                  <button
                    key={acc.username}
                    onClick={() => fillAccount(acc)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      username === acc.username
                        ? 'bg-oil-accent/20 border-oil-accent/60 shadow-glow-blue'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-oil-accent/30'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        username === acc.username ? 'text-oil-accent' : 'text-oil-text-muted'
                      }`}
                    >
                      {acc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{acc.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-oil-panel-light text-oil-text-muted">
                          {roleNames[acc.role]}
                        </span>
                      </div>
                      <div className="text-xs text-oil-text-muted mt-0.5 truncate">
                        {acc.username} / {acc.password} — {acc.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
