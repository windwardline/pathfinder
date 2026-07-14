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
  FACT_EXPIRED: 'A Fact is no longer current',
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { difference } = reroute;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    closeRef.current?.focus();
    return () => {
      if (dialog?.open) dialog.close();
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reroute-title"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink/25 backdrop:backdrop-blur-[2px]"
    >
      <div
        className="flex min-h-full items-end justify-center p-4 sm:items-center"
        onClick={event => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-lg rounded-2xl border border-hairline bg-surface p-7 text-ink shadow-xl">
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
          {difference.deadlineChanges?.length > 0 && (
            <DiffSection label="Deadline changed" tone="amber">
              {difference.deadlineChanges.map(change => change.title).join(', ')}
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
    </dialog>
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
