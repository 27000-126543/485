import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Mountain,
  Drill,
  Droplets,
  Cylinder,
  Wrench,
  Shield,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Building2,
} from 'lucide-react';
import { useUserStore, getRoleName, UserRole } from '@/store/userStore';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '首页大屏',
    icon: <LayoutDashboard size={20} />,
    path: '/dashboard',
    roles: ['hq_admin', 'geologist', 'drilling_engineer', 'oil_worker', 'storage_manager', 'maintenance_engineer', 'safety_officer'],
  },
  {
    key: 'geology',
    label: '地质勘探',
    icon: <Mountain size={20} />,
    path: '/geology',
    roles: ['hq_admin', 'geologist'],
  },
  {
    key: 'drilling',
    label: '钻井调度',
    icon: <Drill size={20} />,
    path: '/drilling',
    roles: ['hq_admin', 'drilling_engineer'],
  },
  {
    key: 'production',
    label: '采油监控',
    icon: <Droplets size={20} />,
    path: '/production',
    roles: ['hq_admin', 'oil_worker'],
  },
  {
    key: 'storage',
    label: '油品储运',
    icon: <Cylinder size={20} />,
    path: '/storage',
    roles: ['hq_admin', 'storage_manager'],
  },
  {
    key: 'maintenance',
    label: '设备运维',
    icon: <Wrench size={20} />,
    path: '/maintenance',
    roles: ['hq_admin', 'maintenance_engineer', 'oil_worker'],
  },
  {
    key: 'safety',
    label: '安全环保',
    icon: <Shield size={20} />,
    path: '/safety',
    roles: ['hq_admin', 'safety_officer', 'oil_worker', 'maintenance_engineer'],
  },
  {
    key: 'system',
    label: '系统管理',
    icon: <Settings size={20} />,
    path: '/system',
    roles: ['hq_admin'],
  },
];

const blocks = [
  { value: 'all', label: '全部区块' },
  { value: 'block_a', label: 'A区采油厂' },
  { value: 'block_b', label: 'B区采油厂' },
  { value: 'block_c', label: 'C区采油厂' },
  { value: 'block_d', label: 'D区采油厂' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setBlock } = useUserStore();
  const [blockDropdown, setBlockDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const currentBlock = blocks.find((b) => b.value === (user?.block || 'all')) || blocks[0];

  const visibleMenuItems = user
    ? menuItems.filter((item) => item.roles.includes(user.role))
    : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBlockChange = (value: string) => {
    setBlock(value);
    setBlockDropdown(false);
  };

  return (
    <div className="min-h-screen bg-oil-bg text-oil-text">
      <header className="fixed top-0 left-0 right-0 h-16 bg-oil-panel border-b border-oil-accent/20 z-50 flex items-center px-6 gap-6">
        <div className="flex items-center gap-3 min-w-[220px]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-oil-accent to-oil-cyan flex items-center justify-center shadow-glow-blue">
            <Droplets size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">油田综合管理系统</h1>
            <p className="text-xs text-oil-text-muted">OilField Management System</p>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="relative">
            <button
              onClick={() => {
                setBlockDropdown(!blockDropdown);
                setUserDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-oil-panel-light rounded-lg border border-oil-accent/30 hover:border-oil-accent/60 transition-all hover:shadow-glow-blue"
            >
              <Building2 size={18} className="text-oil-accent" />
              <span className="text-sm">{currentBlock.label}</span>
              <ChevronDown size={16} className={`text-oil-text-muted transition-transform ${blockDropdown ? 'rotate-180' : ''}`} />
            </button>
            {blockDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-oil-panel border border-oil-accent/30 rounded-lg shadow-glow-blue overflow-hidden">
                {blocks.map((block) => (
                  <button
                    key={block.value}
                    onClick={() => handleBlockChange(block.value)}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      currentBlock.value === block.value
                        ? 'bg-oil-accent/20 text-oil-accent border-l-2 border-oil-accent'
                        : 'hover:bg-oil-panel-light text-oil-text'
                    }`}
                  >
                    {block.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setUserDropdown(!userDropdown);
              setBlockDropdown(false);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-oil-panel-light transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-oil-purple to-oil-accent flex items-center justify-center shadow-glow-purple">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={18} className="text-white" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">{user?.name || '用户'}</p>
              <p className="text-xs text-oil-text-muted">{user ? getRoleName(user.role) : ''}</p>
            </div>
            <ChevronDown size={16} className={`text-oil-text-muted transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
          </button>
          {userDropdown && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-oil-panel border border-oil-accent/30 rounded-lg shadow-glow-blue overflow-hidden">
              <div className="px-4 py-3 border-b border-oil-accent/20">
                <p className="text-sm text-white font-medium">{user?.name}</p>
                <p className="text-xs text-oil-text-muted mt-1">账号: {user?.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-2 text-sm text-oil-red hover:bg-oil-red/10 transition-colors"
              >
                <LogOut size={16} />
                退出登录
              </button>
            </div>
          )}
        </div>
      </header>

      <aside className="fixed top-16 left-0 bottom-0 w-60 bg-oil-panel border-r border-oil-accent/20 pt-4 overflow-y-auto">
        <nav className="px-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-oil-accent/20 text-oil-accent shadow-glow-blue border-l-2 border-oil-accent'
                    : 'text-oil-text-muted hover:text-white hover:bg-oil-panel-light'
                }`}
              >
                <span className={isActive ? 'text-oil-accent' : ''}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="ml-60 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
