import { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  MessageSquare,
  Target,
  Zap,
  Layers,
} from 'lucide-react';
import ApprovalFlow, { type ApprovalStep } from '@/components/ApprovalFlow';
import { useUserStore } from '@/store/userStore';
import http from '@/utils/request';
type RiskLevel = 'low' | 'medium' | 'high';

interface WellProposal {
  id: string;
  wellName: string;
  blockName: string;
  predictedProduction: number;
  predictedProductionRange: string;
  riskLevel: RiskLevel;
  estimatedDepth: number;
  estimatedCost: number;
  coordinates: { x: number; y: number };
  geologicalFeatures: string[];
  confidence: number;
  aiScore: number;
  createdAt: string;
  steps: ApprovalStep[];
}

const mockProposals: WellProposal[] = [
  {
    id: 'P001',
    wellName: 'A-新探01井',
    blockName: 'A区采油厂',
    predictedProduction: 58.6,
    predictedProductionRange: '45-72',
    riskLevel: 'medium',
    estimatedDepth: 3680,
    estimatedCost: 2860,
    coordinates: { x: 28, y: 35 },
    geologicalFeatures: ['砂岩储层', '厚度大', '孔隙度好'],
    confidence: 89,
    aiScore: 92,
    createdAt: '2026-06-14 09:23',
    steps: [
      { id: 's1', title: 'AI推荐生成', assignee: 'AI系统', role: '系统自动', status: 'approved', comment: '基于三维地质模型分析推荐', createdAt: '2026-06-14 09:23', completedAt: '2026-06-14 09:23' },
      { id: 's2', title: '地质师复核', assignee: '张明远', role: '地质工程师', status: 'approved', comment: '地质数据可靠，建议进入审批流程', createdAt: '2026-06-14 09:23', completedAt: '2026-06-14 14:50' },
      { id: 's3', title: '总工程师审批', assignee: '李国栋', role: '总工程师', status: 'pending', deadline: new Date(Date.now() + 6 * 3600000).toISOString() },
      { id: 's4', title: '预算审核', assignee: '王财务', role: '物供经理', status: 'skipped' },
    ],
  },
  {
    id: 'P002',
    wellName: 'B-新探01井',
    blockName: 'B区采油厂',
    predictedProduction: 82.3,
    predictedProductionRange: '68-95',
    riskLevel: 'low',
    estimatedDepth: 4120,
    estimatedCost: 3520,
    coordinates: { x: 62, y: 58 },
    geologicalFeatures: ['海相沉积', '裂缝发育', '高产井组'],
    confidence: 94,
    aiScore: 96,
    createdAt: '2026-06-13 14:08',
    steps: [
      { id: 's1', title: 'AI推荐生成', assignee: 'AI系统', role: '系统自动', status: 'approved', createdAt: '2026-06-13 14:08', completedAt: '2026-06-13 14:08' },
      { id: 's2', title: '地质师复核', assignee: '陈地质', role: '地质工程师', status: 'processing', createdAt: '2026-06-13 14:08', deadline: new Date(Date.now() + 2 * 3600000).toISOString() },
      { id: 's3', title: '总工程师审批', assignee: '李国栋', role: '总工程师', status: 'pending' },
      { id: 's4', title: '预算审核', assignee: '王财务', role: '物供经理', status: 'pending' },
    ],
  },
  {
    id: 'P003',
    wellName: 'C-新探02井',
    blockName: 'C区采油厂',
    predictedProduction: 36.8,
    predictedProductionRange: '25-48',
    riskLevel: 'high',
    estimatedDepth: 5280,
    estimatedCost: 4980,
    coordinates: { x: 75, y: 28 },
    geologicalFeatures: ['深层油气', '高温高压', '技术挑战大'],
    confidence: 68,
    aiScore: 71,
    createdAt: '2026-06-12 10:45',
    steps: [
      { id: 's1', title: 'AI推荐生成', assignee: 'AI系统', role: '系统自动', status: 'approved', comment: '高风险但高回报，建议专家论证', createdAt: '2026-06-12 10:45', completedAt: '2026-06-12 10:45' },
      { id: 's2', title: '地质师复核', assignee: '刘专家', role: '地质工程师', status: 'rejected', comment: '风险过高，建议暂缓，先进行二维勘探补充数据', createdAt: '2026-06-12 10:45', completedAt: '2026-06-15 09:30' },
      { id: 's3', title: '总工程师审批', assignee: '李国栋', role: '总工程师', status: 'skipped' },
      { id: 's4', title: '预算审核', assignee: '王财务', role: '物供经理', status: 'skipped' },
    ],
  },
  {
    id: 'P004',
    wellName: 'D-新探01井',
    blockName: 'D区采油厂',
    predictedProduction: 49.2,
    predictedProductionRange: '38-62',
    riskLevel: 'medium',
    estimatedDepth: 3950,
    estimatedCost: 3210,
    coordinates: { x: 45, y: 72 },
    geologicalFeatures: ['陆相沉积', '砂体展布稳定', '邻井产量好'],
    confidence: 86,
    aiScore: 88,
    createdAt: '2026-06-15 16:30',
    steps: [
      { id: 's1', title: 'AI推荐生成', assignee: 'AI系统', role: '系统自动', status: 'approved', createdAt: '2026-06-15 16:30', completedAt: '2026-06-15 16:30' },
      { id: 's2', title: '地质师复核', assignee: '待分配', role: '地质工程师', status: 'pending', deadline: new Date(Date.now() + 20 * 3600000).toISOString() },
      { id: 's3', title: '总工程师审批', assignee: '李国栋', role: '总工程师', status: 'pending' },
      { id: 's4', title: '预算审核', assignee: '王财务', role: '物供经理', status: 'pending' },
    ],
  },
];

const riskStyles: Record<RiskLevel, { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
  low: { bg: 'bg-oil-green/20', text: 'text-oil-green', border: 'border-oil-green/50', label: '低风险', icon: <Target size={12} /> },
  medium: { bg: 'bg-oil-yellow/20', text: 'text-oil-yellow', border: 'border-oil-yellow/50', label: '中风险', icon: <AlertTriangle size={12} /> },
  high: { bg: 'bg-oil-red/20', text: 'text-oil-red', border: 'border-oil-red/50', label: '高风险', icon: <AlertTriangle size={12} /> },
};

export default function Geology() {
  const { user } = useUserStore();
  const [proposals, setProposals] = useState<WellProposal[]>(mockProposals);
  const [selectedId, setSelectedId] = useState<string>(mockProposals[0].id);
  const [commentModal, setCommentModal] = useState<{ proposalId: string; stepId: string; action: 'approve' | 'reject' } | null>(null);
  const [commentText, setCommentText] = useState('');

  const fetchData = async () => {
    try {
      const data = await http.get<WellProposal[]>('/geology/proposals');
      if (data && data.length) setProposals(data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const selected = proposals.find(p => p.id === selectedId) || proposals[0] || mockProposals[0];

  const canApprove = (step: ApprovalStep) => {
    if (!user) return false;
    if (step.status !== 'pending' && step.status !== 'processing') return false;
    return user.role === 'hq_admin' || user.role === 'geologist' || user.role === 'chief_engineer';
  };

  const handleAction = () => {
    if (!commentModal) return;
    setProposals(prev => prev.map(p => {
      if (p.id !== commentModal.proposalId) return p;
      return {
        ...p,
        steps: p.steps.map(s => {
          if (s.id !== commentModal.stepId) return s;
          return {
            ...s,
            status: commentModal.action === 'approve' ? 'approved' : 'rejected',
            comment: commentText,
            completedAt: new Date().toLocaleString('zh-CN'),
          };
        }),
      };
    }));
    setCommentModal(null);
    setCommentText('');
  };

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">地质勘探</h2>
        <p className="text-oil-text-muted">AI智能推荐井位 · 三维地质模型 · 审批流程管理</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          <div className="bg-oil-panel rounded-xl border border-oil-cyan/20 p-5 shadow-glow-cyan">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="text-oil-cyan" size={20} /> AI推荐井位
              </h3>
              <span className="text-xs text-oil-text-muted px-2 py-1 bg-oil-panel-light rounded-full">{proposals.length}个候选</span>
            </div>

            <div className="space-y-3">
              {proposals.map(p => {
                const risk = riskStyles[p.riskLevel] || riskStyles.low;
                const isSelected = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'bg-oil-accent/10 border-oil-accent/60 shadow-glow-blue scale-[1.01]'
                        : 'bg-oil-panel-light border-oil-accent/20 hover:border-oil-accent/40'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-semibold">{p.wellName}</h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${risk.bg} ${risk.text} ${risk.border}`}>
                            {risk.icon} {risk.label}
                          </span>
                        </div>
                        <p className="text-xs text-oil-text-muted flex items-center gap-1">
                          <MapPin size={12} /> {p.blockName}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-oil-accent">{p.predictedProduction}<span className="text-xs text-oil-text-muted ml-1">吨/日</span></div>
                        <div className="text-xs text-oil-green flex items-center gap-1 justify-end">
                          <TrendingUp size={12} /> 置信度 {p.confidence}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-oil-accent/10">
                      <div>
                        <span className="text-oil-text-muted">预测范围</span>
                        <div className="text-white mt-0.5">{p.predictedProductionRange} 吨/日</div>
                      </div>
                      <div>
                        <span className="text-oil-text-muted">设计深度</span>
                        <div className="text-white mt-0.5">{p.estimatedDepth} 米</div>
                      </div>
                      <div>
                        <span className="text-oil-text-muted">预算</span>
                        <div className="text-white mt-0.5">{p.estimatedCost} 万元</div>
                      </div>
                      <div>
                        <span className="text-oil-text-muted">AI评分</span>
                        <div className={`mt-0.5 font-semibold ${p.aiScore >= 90 ? 'text-oil-green' : p.aiScore >= 80 ? 'text-oil-cyan' : 'text-oil-yellow'}`}>
                          {p.aiScore} 分
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {(p.geologicalFeatures || []).map(f => (
                        <span key={f} className="text-xs px-2 py-0.5 rounded bg-oil-purple/15 text-oil-purple border border-oil-purple/30">
                          <Layers size={10} className="inline mr-1" />{f}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="bg-oil-panel rounded-xl border border-oil-accent/20 p-5 shadow-glow-blue">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Zap className="text-oil-accent" size={20} /> 审批流程 - {selected.wellName}
              </h3>
              <span className="text-xs text-oil-text-muted">创建: {selected.createdAt}</span>
            </div>
            <ApprovalFlow steps={selected.steps || []} title="" />

            {(selected.steps || []).filter(s => canApprove(s)).length > 0 && (
              <div className="mt-4 pt-4 border-t border-oil-accent/10 flex gap-3">
                {(selected.steps || []).filter(s => canApprove(s)).map(s => (
                  <div key={s.id} className="flex gap-2 items-center">
                    <span className="text-sm text-oil-text-muted mr-2">{s.title}:</span>
                    <button
                      onClick={() => setCommentModal({ proposalId: selected.id, stepId: s.id, action: 'approve' })}
                      className="px-4 py-2 rounded-lg bg-oil-green/20 text-oil-green border border-oil-green/50 hover:bg-oil-green/30 hover:shadow-glow-green text-sm font-medium transition-all flex items-center gap-1.5"
                    >
                      <Check size={14} /> 通过
                    </button>
                    <button
                      onClick={() => setCommentModal({ proposalId: selected.id, stepId: s.id, action: 'reject' })}
                      className="px-4 py-2 rounded-lg bg-oil-red/20 text-oil-red border border-oil-red/50 hover:bg-oil-red/30 hover:shadow-glow-red text-sm font-medium transition-all flex items-center gap-1.5"
                    >
                      <X size={14} /> 驳回
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-oil-panel rounded-xl border border-oil-purple/20 p-5 shadow-glow-purple relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="text-oil-purple" size={20} /> 三维地质模型
              </h3>
              <div className="flex items-center gap-2 text-xs text-oil-text-muted">
                <span className="w-2 h-2 rounded-full bg-oil-green animate-pulse-slow" /> 实时渲染中
              </div>
            </div>

            <div
              className="relative h-80 rounded-lg overflow-hidden border border-oil-accent/30"
              style={{
                background: `
                  linear-gradient(135deg, #0A1628 0%, #112240 50%, #0A1628 100%),
                  repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(59,130,246,0.08) 40px, rgba(59,130,246,0.08) 41px),
                  repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(59,130,246,0.08) 40px, rgba(59,130,246,0.08) 41px)
                `,
                backgroundBlendMode: 'normal, normal, normal',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(ellipse at 30% 40%, rgba(6,182,212,0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.12) 0%, transparent 50%)
                  `,
                }}
              />

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="layer1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="layer2" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <path d="M0,50 Q20,40 40,45 T80,50 T100,48 L100,70 L0,70 Z" fill="url(#layer1)" opacity="0.6" />
                <path d="M0,65 Q25,58 50,62 T100,60 L100,85 L0,85 Z" fill="url(#layer2)" opacity="0.5" />
                <path d="M0,80 Q30,75 60,78 T100,75 L100,100 L0,100 Z" fill="rgba(16,185,129,0.1)" />
              </svg>

              {proposals.map(p => {
                const isSel = p.id === selectedId;
                const risk = riskStyles[p.riskLevel] || riskStyles.low;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`absolute cursor-pointer transition-all -translate-x-1/2 -translate-y-1/2 ${isSel ? 'z-10 scale-125' : 'hover:scale-110'}`}
                    style={{ left: `${p.coordinates.x}%`, top: `${p.coordinates.y}%` }}
                  >
                    <div className={`relative ${isSel ? 'animate-pulse-slow' : ''}`}>
                      {isSel && (
                        <div className="absolute inset-0 -m-2 rounded-full border border-oil-accent/50 animate-ping opacity-75" />
                      )}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${isSel ? 'bg-oil-accent border-white shadow-glow-blue' : `${risk.bg} ${risk.border}`}`}>
                        <MapPin size={10} className={isSel ? 'text-white' : risk.text} />
                      </div>
                    </div>
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded ${isSel ? 'bg-oil-accent text-white' : 'bg-oil-panel/90 border border-oil-accent/30 text-oil-text'}`}>
                      {p.wellName}
                    </div>
                  </div>
                );
              })}

              <div className="absolute bottom-3 left-3 bg-oil-panel/90 rounded-lg border border-oil-accent/30 p-3 backdrop-blur-sm">
                <div className="text-xs text-oil-text-muted mb-2">图例</div>
                <div className="space-y-1.5">
                  {(Object.keys(riskStyles) as RiskLevel[]).map(r => {
                    const s = riskStyles[r];
                    return (
                      <div key={r} className="flex items-center gap-2 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.bg} border ${s.border}`} />
                        <span className="text-oil-text">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="absolute top-3 right-3 bg-oil-panel/90 rounded-lg border border-oil-accent/30 p-3 backdrop-blur-sm text-xs">
                <div className="text-oil-text-muted mb-1">选中井位</div>
                <div className="text-white font-semibold mb-2">{selected.wellName}</div>
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-oil-text-muted">日产预测</span>
                    <span className="text-oil-accent font-medium">{selected.predictedProduction}吨</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-oil-text-muted">设计深度</span>
                    <span className="text-white">{selected.estimatedDepth}米</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {commentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-oil-panel border border-oil-accent/40 rounded-2xl shadow-glow-blue w-full max-w-lg overflow-hidden">
            <div className={`px-6 py-4 border-b border-oil-accent/20 ${commentModal.action === 'approve' ? 'bg-oil-green/10' : 'bg-oil-red/10'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${commentModal.action === 'approve' ? 'text-oil-green' : 'text-oil-red'}`}>
                <MessageSquare size={20} />
                {commentModal.action === 'approve' ? '审批通过意见' : '审批驳回意见'}
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-sm text-oil-text-muted mb-2">请填写审批意见<span className="text-oil-red"> *</span></label>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={4}
                placeholder={commentModal.action === 'approve' ? '请输入通过理由...' : '请输入驳回原因及改进建议...'}
                className="w-full px-4 py-3 bg-oil-panel-light border border-oil-accent/30 rounded-lg text-white placeholder:text-oil-text-muted focus:outline-none focus:border-oil-accent focus:shadow-glow-blue transition-all resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-oil-accent/20 flex justify-end gap-3">
              <button
                onClick={() => { setCommentModal(null); setCommentText(''); }}
                className="px-5 py-2 rounded-lg border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent/60 text-sm font-medium transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAction}
                disabled={!commentText.trim()}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                  commentModal.action === 'approve'
                    ? 'bg-oil-green text-white hover:shadow-glow-green'
                    : 'bg-oil-red text-white hover:shadow-glow-red'
                }`}
              >
                {commentModal.action === 'approve' ? <Check size={16} /> : <X size={16} />}
                确认{commentModal.action === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
