'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { api, RerouteRecord } from '@/lib/client-api';
import { useRouteData } from '@/lib/use-route-data';
import { FocusActionCard } from './FocusActionCard';
import { RerouteSummary } from './RerouteSummary';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

/**
 * Today: the focused presentation of the Route — the Focus Action, its
 * explanation, and a short look at what's coming, without implying the Route
 * is limited to what's shown.
 */
export function TodayView() {
  const { data, loading, error, refresh } = useRouteData();
  const [completing, setCompleting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reroute, setReroute] = useState<RerouteRecord | null>(null);

  const complete = async (actionId: string) => {
    setCompleting(actionId);
    setActionError(null);
    try {
      const result = await api.completeAction(actionId);
      await refresh();
      if (result.reroute) setReroute(result.reroute);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'The Action could not be completed.');
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading your Route">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={refresh} />;
  }
  if (!data) return null;

  const { route, proposedCount } = data;
  const focus = route.steps.find(s => s.status === 'FOCUS');
  const upNext = route.steps.filter(s => s.status === 'UPCOMING').slice(0, 3);

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">Today</p>
        <h1 className="mt-1.5 font-serif text-3xl tracking-tight md:text-4xl">
          {focus ? 'What comes next' : 'Your Route'}
        </h1>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-amber-soft px-4 py-3 text-sm text-amber">
          {error} Your last valid Route is shown below.
        </p>
      )}
      {actionError && (
        <p role="alert" className="mb-6 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">
          {actionError}
        </p>
      )}

      {proposedCount > 0 && (
        <Link
          href="/facts"
          className="mb-6 flex items-center justify-between rounded-xl border border-amber/30 bg-amber-soft px-5 py-3.5 text-sm text-amber transition-opacity hover:opacity-90"
        >
          <span>
            {proposedCount} Proposed {proposedCount === 1 ? 'Fact' : 'Facts'} awaiting your review.
            Proposed Facts don&apos;t affect your Route until you confirm them.
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      )}

      {route.status === 'EMPTY' && <EmptyState kind="no-facts" onSeeded={refresh} />}
      {route.status === 'COMPLETED' && <EmptyState kind="route-completed" />}
      {route.status === 'BLOCKED' && <EmptyState kind="route-blocked" />}

      {focus && (
        <>
          <FocusActionCard
            step={focus}
            completing={completing === focus.actionId}
            onComplete={complete}
          />

          {upNext.length > 0 && (
            <section aria-label="Coming up" className="mt-10">
              <h2 className="text-xs font-medium uppercase tracking-widest text-ink-faint">
                Coming up
              </h2>
              <ul className="mt-3 space-y-2">
                {upNext.map(step => (
                  <li
                    key={step.actionId}
                    className="rounded-lg border border-hairline bg-surface px-4 py-3 text-sm text-ink-soft"
                  >
                    {step.title}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-8 text-sm text-ink-faint">
            <Link href="/route" className="text-spruce underline-offset-2 hover:underline">
              See your complete Route
            </Link>{' '}
            — every step, what&apos;s blocked, and why.
          </p>
        </>
      )}

      {reroute && <RerouteSummary reroute={reroute} onClose={() => setReroute(null)} />}
    </div>
  );
}
