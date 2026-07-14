import { cn } from '@/lib/utils';

const STYLES: Record<string, { label: string; className: string }> = {
  FOCUS: { label: 'Focus Action', className: 'bg-spruce-soft text-spruce-ink' },
  UPCOMING: { label: 'Upcoming', className: 'bg-raised text-ink-soft' },
  BLOCKED: { label: 'Blocked', className: 'bg-amber-soft text-amber' },
  COMPLETED: { label: 'Completed', className: 'bg-raised text-ink-faint' },
  PROPOSED: { label: 'Proposed Fact', className: 'bg-amber-soft text-amber' },
  CONFIRMED: { label: 'Confirmed Fact', className: 'bg-spruce-soft text-spruce-ink' },
  REJECTED: { label: 'Rejected', className: 'bg-raised text-ink-faint' },
  SUPERSEDED: { label: 'Superseded', className: 'bg-raised text-ink-faint' },
  EXPIRED: { label: 'Expired', className: 'bg-raised text-ink-faint' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STYLES[status] ?? { label: status, className: 'bg-raised text-ink-soft' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  );
}
