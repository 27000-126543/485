import { TrendingUp, TrendingDown } from 'lucide-react';

type GlowColor = 'blue' | 'cyan' | 'green' | 'yellow' | 'red' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change: number;
  changeLabel?: string;
  icon: React.ReactNode;
  glowColor?: GlowColor;
}

const glowMap: Record<GlowColor, { shadow: string; border: string; bg: string; text: string }> = {
  blue: {
    shadow: 'shadow-glow-blue',
    border: 'border-oil-accent/40',
    bg: 'from-oil-accent/20 to-oil-accent/5',
    text: 'text-oil-accent',
  },
  cyan: {
    shadow: 'shadow-glow-cyan',
    border: 'border-oil-cyan/40',
    bg: 'from-oil-cyan/20 to-oil-cyan/5',
    text: 'text-oil-cyan',
  },
  green: {
    shadow: 'shadow-glow-green',
    border: 'border-oil-green/40',
    bg: 'from-oil-green/20 to-oil-green/5',
    text: 'text-oil-green',
  },
  yellow: {
    shadow: 'shadow-glow-yellow',
    border: 'border-oil-yellow/40',
    bg: 'from-oil-yellow/20 to-oil-yellow/5',
    text: 'text-oil-yellow',
  },
  red: {
    shadow: 'shadow-glow-red',
    border: 'border-oil-red/40',
    bg: 'from-oil-red/20 to-oil-red/5',
    text: 'text-oil-red',
  },
  purple: {
    shadow: 'shadow-glow-purple',
    border: 'border-oil-purple/40',
    bg: 'from-oil-purple/20 to-oil-purple/5',
    text: 'text-oil-purple',
  },
};

export default function StatCard({
  title,
  value,
  unit,
  change,
  changeLabel = '环比',
  icon,
  glowColor = 'blue',
}: StatCardProps) {
  const glow = glowMap[glowColor];
  const isPositive = change >= 0;

  return (
    <div
      className={`relative bg-oil-panel rounded-xl border ${glow.border} ${glow.shadow} p-5 overflow-hidden transition-transform hover:scale-[1.02]`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${glow.bg}`} />

      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${glow.bg} flex items-center justify-center ${glow.text}`}
        >
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-oil-green' : 'text-oil-red'
          }`}
        >
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
        </div>
      </div>

      <p className="text-sm text-oil-text-muted mb-2">{title}</p>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {unit && <span className="text-sm text-oil-text-muted">{unit}</span>}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <span className="text-xs text-oil-text-muted">
          {changeLabel}：{isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
