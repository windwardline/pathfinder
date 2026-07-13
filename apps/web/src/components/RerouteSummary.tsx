'use client';

import { useEffect, useRef } from 'react';
import { RerouteRecord } from '@/lib/client-api';
import { X } from 'lucide-react';

const REASON_LABELS: Record<string, string> = {
  FACT_CONFIRMED: 'You confirmed a fact',
  FACT_SUPERSEDED: 'A fact was superseded',
  FACT_REJECTED: 'A fact was rejected',
  ACTION_COMPLETED: 'You completed an Action',
  DEADLINE_CHANGED: 'A deadline changed',
  MANUAL_REFRESH: 'Your Route was refreshed',
};

/**
 * The Reroute experience: after a confirmed change, explain what changed,
 * why, what moved, what became blocked, and what became available — from the
 * structured Route Difference, never inferred client-side.
 */
export function RerouteSummary({
  reroute,
  onClose,
}: {
  reroute: RerouteRecord;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { difference } = reroute;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reroute-title"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-hairline bg-surface p-7 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-spruce">
              Your Route was updated
            </p>
            <h2 id="reroute-title" className="mt-1.5 font-serif text-2xl">
              {REASON_LABELS[reroute.reason] ?? 'Your circumstances changed'}
            </h2>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close Reroute summary"
            className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          {difference.focusActionChanged && difference.newFocus && (
            <DiffSection label="Your new Focus Action">
              <span className="font-serif text-base">{difference.newFocus.title}</span>
            </DiffSection>
          )}
          {difference.completed.length > 0 && (
            <DiffSection label="Completed">
              {difference.completed.map(s => s.title).join(', ')}
            </DiffSection>
          )}
          {difference.newlyAvailable.length > 0 && (
            <DiffSection label="Became available" tone="spruce">
              {difference.newlyAvailable.map(s => s.title).join(', ')}
            </DiffSection>
          )}
          {difference.newlyBlocked.length > 0 && (
            <DiffSection label="Became blocked" tone="amber">
              {difference.newlyBlocked.map(s => s.title).join(', ')}
            </DiffSection>
          )}
          {difference.added.length > 0 && (
            <DiffSection label="Added to your Route">
              {difference.added.map(s => s.title).join(', ')}
            </DiffSection>
          )}
          {difference.removed.length > 0 && (
            <DiffSection label="No longer on your Route">
              {difference.removed.map(s => s.title).join(', ')}
            </DiffSection>
          )}
          {difference.moved.length > 0 && (
            <DiffSection label="Moved">
              {difference.moved.map(m => `${m.title} (#${m.fromRank} → #${m.toRank})`).join(', ')}
            </DiffSection>
          )}
        </dl>

        <button
          onClick={onClose}
          className="mt-7 w-full rounded-lg bg-spruce px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
        >
          Back to your Route
        </button>
      </div>
    </div>
  );
}

function DiffSection({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: 'spruce' | 'amber';
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <dt
        className={
          tone === 'spruce'
            ? 'w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-spruce'
            : tone === 'amber'
              ? 'w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-amber'
              : 'w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-ink-faint'
        }
      >
        {label}
      </dt>
      <dd className="min-w-0 leading-relaxed">{children}</dd>
    </div>
  );
}
