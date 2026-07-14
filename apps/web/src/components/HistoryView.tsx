'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, HistoryEntry } from '@/lib/client-api';
import { ErrorState } from './ErrorState';

const REASON_LABELS: Record<string, string> = {
  FACT_CONFIRMED: 'Fact confirmed',
  FACT_SUPERSEDED: 'Fact superseded',
  FACT_REJECTED: 'Fact rejected',
  ACTION_COMPLETED: 'Action completed',
  DEADLINE_CHANGED: 'Deadline changed',
  MANUAL_REFRESH: 'Route refreshed',
};

/**
 * Route History: the chronological record of Reroute Events, each with its
 * structured Route Difference.
 */
export function HistoryView() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await api.getHistory();
      setHistory(result.history);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Route History could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getHistory()
      .then(result => {
        if (cancelled) return;
        setHistory(result.history);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Route History could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading Route History">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    );
  }
  if (error && !history) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Route History
        </p>
        <h1 className="mt-1.5 font-serif text-3xl tracking-tight md:text-4xl">
          How your Route has changed
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
          Every Reroute is recorded: what triggered it and exactly what moved, unlocked, or
          became blocked.
        </p>
      </header>

      {(history ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline px-5 py-8 text-center text-sm text-ink-faint">
          No Reroutes yet. When you confirm a fact or complete an Action, the change shows up
          here.
        </p>
      ) : (
        <ol className="space-y-4">
          {(history ?? []).map(entry => (
            <li key={entry.id} className="rounded-xl border border-hairline bg-surface px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium">
                  {REASON_LABELS[entry.triggerReason] ?? entry.triggerReason}
                </h2>
                <time
                  dateTime={entry.createdAt}
                  className="text-xs text-ink-faint"
                >
                  {new Date(entry.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
              </div>

              {entry.difference ? (
                <ul className="mt-2.5 space-y-1 text-sm text-ink-soft">
                  {entry.difference.focusActionChanged && entry.difference.newFocus && (
                    <li>
                      Focus Action changed to{' '}
                      <span className="text-ink">{entry.difference.newFocus.title}</span>
                    </li>
                  )}
                  {entry.difference.completed.length > 0 && (
                    <li>Completed: {entry.difference.completed.map(s => s.title).join(', ')}</li>
                  )}
                  {entry.difference.newlyAvailable.length > 0 && (
                    <li className="text-spruce">
                      Became available:{' '}
                      {entry.difference.newlyAvailable.map(s => s.title).join(', ')}
                    </li>
                  )}
                  {entry.difference.newlyBlocked.length > 0 && (
                    <li className="text-amber">
                      Became blocked: {entry.difference.newlyBlocked.map(s => s.title).join(', ')}
                    </li>
                  )}
                  {entry.difference.added.length > 0 && (
                    <li>Added: {entry.difference.added.map(s => s.title).join(', ')}</li>
                  )}
                  {entry.difference.removed.length > 0 && (
                    <li>Removed: {entry.difference.removed.map(s => s.title).join(', ')}</li>
                  )}
                </ul>
              ) : (
                <p className="mt-2.5 text-sm text-ink-faint">
                  The details of this Reroute are no longer available.
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
