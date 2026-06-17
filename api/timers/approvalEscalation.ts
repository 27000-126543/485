import { store } from '../data/store.js';
import type { DrillingProposal, ApprovalStep } from '../../shared/types.js';

export function startApprovalEscalationTimer(): NodeJS.Timeout {
  console.log('[ApprovalEscalationTimer] Starting approval escalation timer (every 30s)');

  return setInterval(() => {
    const data = store.getData();
    const proposals = data.drillingProposals;
    const now = Date.now();
    let escalatedCount = 0;

    proposals.forEach((proposal) => {
      if (proposal.escalated) return;

      const geologistApproval = proposal.geologistApproval as ApprovalStep | undefined;
      const deadline = proposal.deadline ? new Date(proposal.deadline).getTime() : null;

      if (
        geologistApproval &&
        geologistApproval.status === 'pending' &&
        deadline &&
        now > deadline
      ) {
        const idx = proposals.findIndex((p) => p.id === proposal.id);
        if (idx >= 0) {
          proposals[idx] = {
            ...proposals[idx],
            escalated: true,
            geologistApproval: {
              ...geologistApproval,
              status: 'approved',
              comment: '地质师审批超时，系统自动升级至总工直接审批',
            },
            chiefEngineerApproval: {
              status: 'pending',
              comment: '审批流程已升级，请总工优先审批',
            } as ApprovalStep,
            status: 'reviewing',
            updatedAt: new Date().toISOString(),
          } as DrillingProposal;

          escalatedCount++;
          console.log(
            `[ApprovalEscalationTimer] Proposal ${proposal.code} escalated: ` +
              `geologist approval timed out, now requires chief engineer direct approval`
          );
        }
      }
    });

    if (escalatedCount > 0) {
      console.log(
        `[ApprovalEscalationTimer] Escalated ${escalatedCount} proposals this cycle`
      );
    }
  }, 30000);
}
