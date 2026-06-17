import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';

export type AlertLevel = 'critical' | 'warning' | 'info' | 'error' | 'danger';

export interface AlertItem {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  source: string;
  time: string;
}

interface AlertTimelineProps {
  alerts: AlertItem[];
  maxHeight?: string;
}

const levelConfig: Record<
  AlertLevel,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    text: string;
    border: string;
    dot: string;
    shadow: string;
  }
> = {
  critical: {
    label: '紧急',
    icon: <XCircle size={14} />,
    bg: 'bg-oil-red/20',
    text: 'text-oil-red',
    border: 'border-oil-red/50',
    dot: 'bg-oil-red',
    shadow: 'shadow-glow-red',
  },
  danger: {
    label: '危险',
    icon: <XCircle size={14} />,
    bg: 'bg-oil-red/20',
    text: 'text-oil-red',
    border: 'border-oil-red/50',
    dot: 'bg-oil-red',
    shadow: 'shadow-glow-red',
  },
  error: {
    label: '错误',
    icon: <AlertCircle size={14} />,
    bg: 'bg-oil-purple/20',
    text: 'text-oil-purple',
    border: 'border-oil-purple/50',
    dot: 'bg-oil-purple',
    shadow: 'shadow-glow-purple',
  },
  warning: {
    label: '警告',
    icon: <AlertTriangle size={14} />,
    bg: 'bg-oil-yellow/20',
    text: 'text-oil-yellow',
    border: 'border-oil-yellow/50',
    dot: 'bg-oil-yellow',
    shadow: 'shadow-glow-yellow',
  },
  info: {
    label: '提示',
    icon: <Info size={14} />,
    bg: 'bg-oil-cyan/20',
    text: 'text-oil-cyan',
    border: 'border-oil-cyan/50',
    dot: 'bg-oil-cyan',
    shadow: 'shadow-glow-cyan',
  },
};

export default function AlertTimeline({ alerts, maxHeight = '600px' }: AlertTimelineProps) {
  const sortedAlerts = [...alerts].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="bg-oil-panel rounded-xl border border-oil-accent/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-oil-accent/20 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">实时预警</h3>
        <span className="text-xs text-oil-text-muted">共 {alerts.length} 条</span>
      </div>

      <div className="relative" style={{ maxHeight, overflowY: 'auto' }}>
        <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-oil-accent/60 via-oil-accent/30 to-transparent" />

        <div className="p-4 space-y-4">
          {sortedAlerts.length === 0 ? (
            <div className="py-12 text-center text-oil-text-muted">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p>暂无预警信息</p>
            </div>
          ) : (
            sortedAlerts.map((alert) => {
              const config = levelConfig[alert.level] || levelConfig.info;
              return (
                <div key={alert.id} className="relative pl-12">
                  <div
                    className={`absolute left-4 top-2 w-3 h-3 rounded-full ${config.dot} ${config.shadow} animate-pulse-slow ring-2 ring-oil-bg`}
                  />

                  <div
                    className={`rounded-lg border ${config.border} ${config.bg} p-4 transition-all hover:scale-[1.01]`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                        <h4 className="text-sm font-medium text-white">{alert.title}</h4>
                      </div>
                      <span className="text-xs text-oil-text-muted whitespace-nowrap flex-shrink-0">
                        {formatTime(alert.time)}
                      </span>
                    </div>

                    <p className="text-sm text-oil-text-muted mb-2">{alert.description}</p>

                    <div className="flex items-center gap-2 text-xs text-oil-text-muted">
                      <span className="px-2 py-0.5 rounded bg-oil-panel-light border border-oil-accent/20">
                        {alert.source}
                      </span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(timeStr: string): string {
  const time = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - time.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${time.getMonth() + 1}/${time.getDate()}`;
}
