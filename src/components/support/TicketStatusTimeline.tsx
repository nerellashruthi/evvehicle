import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';
import type { TicketStatus } from '@/types';

interface TicketStatusTimelineProps {
  status: TicketStatus;
  isEscalated?: boolean;
  isSlaAtRisk?: boolean;
}

export function TicketStatusTimeline({ status, isEscalated, isSlaAtRisk }: TicketStatusTimelineProps) {
  const steps: { key: TicketStatus; label: string }[] = [
    { key: 'OPEN', label: 'Submitted' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED', label: 'Resolved' },
    { key: 'CLOSED', label: 'Closed' },
  ];

  const getStepIndex = (s: TicketStatus): number => {
    switch (s) {
      case 'OPEN':
        return 0;
      case 'ASSIGNED':
        return 1;
      case 'IN_PROGRESS':
      case 'WAITING_FOR_USER':
        return 2;
      case 'RESOLVED':
        return 3;
      case 'CLOSED':
        return 4;
      case 'ESCALATED':
        return 2;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full py-2">
      {/* Alert banner if escalated or SLA at risk */}
      {(isEscalated || isSlaAtRisk || status === 'ESCALATED') && (
        <div className="mb-4 p-2.5 rounded-xl bg-danger-500/10 border border-danger-500/20 flex items-center justify-between text-xs text-danger-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
            <span className="font-semibold">
              {isEscalated || status === 'ESCALATED'
                ? 'Escalated to High Priority Dispatch'
                : 'SLA Response Target At Risk'}
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-danger-500/20">Urgent</span>
        </div>
      )}

      {/* Visual Timeline Steps */}
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-white/10 -z-0" />

        {steps.map((step, idx) => {
          const isDone = idx < currentIndex || status === 'CLOSED';
          const isCurrent = idx === currentIndex && status !== 'CLOSED';
          const isPending = idx > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-acid text-ink-950 ring-4 ring-acid/20'
                    : isCurrent
                    ? status === 'ESCALATED'
                      ? 'bg-danger-500 text-white ring-4 ring-danger-500/30'
                      : 'bg-acid text-ink-950 ring-4 ring-acid/30 animate-pulse'
                    : 'bg-ink-800 border border-white/20 text-ink-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  status === 'ESCALATED' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )
                ) : (
                  <span className="w-2 h-2 rounded-full bg-ink-600" />
                )}
              </div>

              <span
                className={`mt-2 text-[11px] font-medium tracking-tight ${
                  isDone
                    ? 'text-white'
                    : isCurrent
                    ? status === 'ESCALATED'
                      ? 'text-danger-400 font-bold'
                      : 'text-acid font-bold'
                    : 'text-ink-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {status === 'WAITING_FOR_USER' && (
        <div className="mt-3 text-center text-xs text-amber-400 flex items-center justify-center gap-1.5 bg-amber-500/10 py-1.5 rounded-lg border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>Support is awaiting additional information from you.</span>
        </div>
      )}
    </div>
  );
}
