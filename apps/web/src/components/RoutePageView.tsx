'use client';

import { Loader2 } from 'lucide-react';
import { useRouteData } from '@/lib/use-route-data';
import { RouteStepList } from './RouteStepList';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { StatusBadge } from './StatusBadge';

/**
 * The Adaptive Route View: the complete Route in engine order with
 * progressive disclosure per step. Blocked is distinct from inactive; the
 * dependency graph itself is never exposed.
 */
export function RoutePageView() {
  const { data, loading, error, refresh } = useRouteData();

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

  const { route } = data;
  const openCount = route.steps.filter(s => s.status !== 'COMPLETED').length;
  const completedCount = route.steps.length - openCount;

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">Route</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl tracking-tight md:text-4xl">Your complete Route</h1>
          {route.status === 'BLOCKED' && <StatusBadge status="BLOCKED" />}
        </div>
        {route.steps.length > 0 && (
          <p className="mt-2 text-sm text-ink-soft">
            {openCount} {openCount === 1 ? 'step' : 'steps'} ahead
            {completedCount > 0 && `, ${completedCount} completed`}. Ordered by the Route Engine —
            every step explains why it comes next.
          </p>
        )}
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-amber-soft px-4 py-3 text-sm text-amber">
          {error} Your last valid Route is shown below.
        </p>
      )}

      {route.status === 'EMPTY' ? (
        <EmptyState kind="no-facts" onSeeded={refresh} />
      ) : (
        <RouteStepList steps={route.steps} />
      )}
    </div>
  );
}
