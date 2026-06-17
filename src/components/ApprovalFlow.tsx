import { Check, Clock, X, Loader, User } from 'lucide-react';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'skipped';

export interface ApprovalStep {
  id: string;
  title: string;
  assignee: string;
  role: string;
  status: ApprovalStatus;
  comment?: string;
  createdAt?: string;
  completedAt?: string;
  deadline?: string;
}

interface ApprovalFlowProps {
  steps: ApprovalStep[];
  title?: string;
  showAvatars?: boolean;
}

const statusConfig: Record<
  ApprovalStatus,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    text: string;
    border: string;
    line: string;
    shadow: string;
  }
> = {
  pending: {
    label: '待审批',
    icon: <Clock size={16} />,
    bg: 'bg-oil-yellow/20',
    text: 'text-oil-yellow',
    border: 'border-oil-yellow/60',
    line: 'bg-oil-yellow/30',
    shadow: 'shadow-glow-yellow',
  },
  processing: {
    label: '审批中',
    icon: <Loader size={16} className="animate-spin" />,
    bg: 'bg-oil-cyan/20',
    text: 'text-oil-cyan',
    border: 'border-oil-cyan/60',
    line: 'bg-oil-cyan/50',
    shadow: 'shadow-glow-cyan',
  },
  approved: {
    label: '已通过',
    icon: <Check size={16} />,
    bg: 'bg-oil-green/20',
    text: 'text-oil-green',
    border: 'border-oil-green/60',
    line: 'bg-oil-green',
    shadow: 'shadow-glow-green',
  },
  rejected: {
    label: '已驳回',
    icon: <X size={16} />,
    bg: 'bg-oil-red/20',
    text: 'text-oil-red',
    border: 'border-oil-red/60',
    line: 'bg-oil-red',
    shadow: 'shadow-glow-red',
  },
  skipped: {
    label: '已跳过',
    icon: <X size={16} />,
    bg: 'bg-oil-text-muted/20',
    text: 'text-oil-text-muted',
    border: 'border-oil-text-muted/40',
    line: 'bg-oil-text-muted/30',
    shadow: '',
  },
};

function getCountdown(deadline?: string): string | null {
  if (!deadline) return null;
  const end = new Date(deadline).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return '已超时';

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}时`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (parts.length === 0) parts.push(`${Math.ceil(diff / 60000)}分`);

  return parts.join('') + '剩余';
}

export default function ApprovalFlow({ steps, title = '审批流程', showAvatars = true }: ApprovalFlowProps) {
  return (
    <div className="bg-oil-panel rounded-xl border border-oil-accent/20 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-4 text-xs">
          {(['approved', 'processing', 'pending', 'rejected'] as ApprovalStatus[]).map((s) => {
            const cfg = statusConfig[s];
            const count = steps.filter((st) => st.status === s).length;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${cfg.bg} border ${cfg.border}`} />
                <span className="text-oil-text-muted">
                  {cfg.label} <span className="text-white">{count}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative">
        {steps.map((step, index) => {
          const cfg = statusConfig[step.status];
          const isLast = index === steps.length - 1;
          const countdown = getCountdown(step.deadline);
          const isUrgent = countdown === '已超时' || (countdown && countdown.includes('天') === false);

          return (
            <div key={step.id} className="relative flex gap-4">
              {!isLast && (
                <div
                  className={`absolute left-[1.375rem] top-10 bottom-0 w-0.5 ${cfg.line}`}
                  style={{
                    background:
                      step.status === 'approved' || step.status === 'skipped'
                        ? step.status === 'approved'
                          ? '#10B981'
                          : '#64748B4D'
                        : 'linear-gradient(to bottom, currentColor, #112240)',
                    color: step.status === 'processing' ? '#06B6D4' : step.status === 'pending' ? '#F59E0B' : undefined,
                  }}
                />
              )}

              <div className="relative flex-shrink-0 pt-1">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${cfg.border} ${cfg.bg} ${cfg.text} ${cfg.shadow}`}
                >
                  {cfg.icon}
                </div>
              </div>

              <div className="flex-1 pb-8">
                <div
                  className={`rounded-xl border ${cfg.border} ${
                    step.status === 'processing' ? cfg.bg : ''
                  } p-5 transition-all hover:shadow-lg`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-semibold text-white">
                          步骤 {index + 1}：{step.title}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>

                      {showAvatars && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-oil-panel-light border border-oil-accent/30 flex items-center justify-center">
                            <User size={12} className="text-oil-accent" />
                          </div>
                          <span className="text-oil-text">{step.assignee}</span>
                          <span className="text-oil-text-muted">·</span>
                          <span className="text-oil-text-muted">{step.role}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-xs space-y-1">
                      {step.createdAt && (
                        <div className="text-oil-text-muted">提交: {step.createdAt}</div>
                      )}
                      {step.completedAt && (
                        <div className={cfg.text}>完成: {step.completedAt}</div>
                      )}
                      {step.deadline && (step.status === 'pending' || step.status === 'processing') && (
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded font-medium ${
                            isUrgent
                              ? 'bg-oil-red/20 text-oil-red border border-oil-red/40'
                              : 'bg-oil-cyan/20 text-oil-cyan border border-oil-cyan/40'
                          }`}
                        >
                          <Clock size={12} />
                          {countdown}
                        </div>
                      )}
                    </div>
                  </div>

                  {step.comment && (
                    <div className="mt-3 pt-3 border-t border-oil-accent/10">
                      <p className="text-xs text-oil-text-muted mb-1">审批意见：</p>
                      <p className="text-sm text-oil-text">{step.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
