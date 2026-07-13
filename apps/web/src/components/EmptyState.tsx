'use client';

import { useState } from 'react';
import { TopoBackdrop } from './TopoBackdrop';
import { api } from '@/lib/client-api';

/**
 * Differentiated empty states. An empty screen is an invitation to act, and
 * "no facts yet" must never look like "all done" or "something failed."
 */
export function EmptyState({
  kind,
  onSeeded,
}: {
  kind: 'no-facts' | 'route-completed' | 'route-blocked';
  onSeeded?: () => void;
}) {
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const seed = async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      await api.seedDemo();
      onSeeded?.();
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : 'Loading the scenario failed.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface px-8 py-14 text-center">
      <TopoBackdrop className="pointer-events-none absolute inset-0 h-full w-full text-spruce" />
      <div className="relative">
        {kind === 'no-facts' && (
          <>
            <h2 className="font-serif text-2xl">Your Route starts with a fact</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              Add what you know — a job offer, a housing application, a supervision schedule —
              and confirm it. Pathfinder turns Confirmed Facts into a Route: what comes next,
              why it comes next, and what it unlocks.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/facts"
                className="rounded-lg bg-spruce px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
              >
                Add your first facts
              </a>
              <button
                onClick={seed}
                disabled={seeding}
                className="rounded-lg border border-hairline px-5 py-2.5 text-sm text-ink-soft transition-colors hover:bg-raised disabled:opacity-60"
              >
                {seeding ? 'Loading scenario…' : 'Load the demonstration scenario'}
              </button>
            </div>
            {seedError && <p className="mt-4 text-sm text-brick">{seedError}</p>}
          </>
        )}

        {kind === 'route-completed' && (
          <>
            <h2 className="font-serif text-2xl">Every Action on your Route is complete</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              When circumstances change, add and confirm new facts — your Route will
              recalculate and explain what changed.
            </p>
            <a
              href="/facts"
              className="mt-8 inline-block rounded-lg bg-spruce px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
            >
              Add new facts
            </a>
          </>
        )}

        {kind === 'route-blocked' && (
          <>
            <h2 className="font-serif text-2xl">Your Route is blocked right now</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              No Action is currently available. Review the blocked steps on your Route to see
              which conditions need to change first.
            </p>
            <a
              href="/route"
              className="mt-8 inline-block rounded-lg bg-spruce px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
            >
              Review blocked steps
            </a>
          </>
        )}
      </div>
    </div>
  );
}
