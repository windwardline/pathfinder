'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { RouteStep } from '@/lib/client-api';
import { StatusBadge } from './StatusBadge';

/**
 * The Focus Action: title, why it comes next, what it unlocks, provenance
 * context, and the primary call to action. The client never chooses or
 * substitutes the Focus Action — it renders what the Route API returned.
 */
export function FocusActionCard({
  step,
  completing,
  onComplete,
}: {
  step: RouteStep;
  completing: boolean;
  onComplete: (actionId: string) => void;
}) {
  const [showReasons, setShowReasons] = useState(false);
  const provenanceSources = [
    ...new Set(step.provenance.map(item => provenanceLabel(item.source))),
  ];

  return (
    <article
      aria-labelledby="focus-action-title"
      className="relative overflow-hidden rounded-2xl border border-spruce/25 bg-surface shadow-[0_1px_3px_rgba(28,35,33,0.06)]"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-spruce" aria-hidden="true" />
      <div className="px-7 py-7 md:px-9 md:py-8">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="focus-marker inline-block h-2.5 w-2.5 rounded-full bg-spruce"
          />
          <StatusBadge status="FOCUS" />
        </div>

        <h2 id="focus-action-title" className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
          {step.title}
        </h2>
        {step.description && (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            {step.description}
          </p>
        )}

        <div className="mt-6 rounded-xl bg-raised px-5 py-4">
          <h3 className="font-serif text-sm italic text-ink-soft">Why it comes next.</h3>
          <p className="mt-1.5 text-sm leading-relaxed">{step.explanation}</p>
          {step.unlocks.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-ink-soft">Unlocks:</span>
              {step.unlocks.map(title => (
                <span
                  key={title}
                  className="rounded-full bg-spruce-soft px-2.5 py-0.5 text-xs text-spruce-ink"
                >
                  {title}
                </span>
              ))}
            </div>
          )}
          {step.deadline && (
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              <span className="font-medium">Confirmed Deadline:</span>{' '}
              <time dateTime={step.deadline}>
                {new Date(step.deadline).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </time>
            </p>
          )}
          {step.mandatoryObligation && (
            <p className="mt-2 text-xs text-ink-soft">
              A Confirmed mandatory Obligation influenced this placement.
            </p>
          )}
          {provenanceSources.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              <span className="font-medium">Supported by:</span>{' '}
              {provenanceSources.join(' · ')}
            </p>
          )}
          <button
            onClick={() => setShowReasons(v => !v)}
            aria-expanded={showReasons}
            className="mt-3 text-xs text-ink-faint underline-offset-2 hover:text-ink-soft hover:underline"
          >
            {showReasons ? 'Hide reason codes' : 'Show reason codes'}
          </button>
          {showReasons && (
            <p className="mt-2 font-mono text-[11px] tracking-wide text-ink-faint">
              {step.reasonCodes.join(' · ')}
            </p>
          )}
        </div>

        <div className="mt-7">
          <button
            onClick={() => onComplete(step.actionId)}
            disabled={completing}
            className="inline-flex items-center gap-2 rounded-lg bg-spruce px-6 py-3 text-sm font-medium text-paper transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            {completing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Completing…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Mark as complete
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function provenanceLabel(source: string): string {
  const labels: Record<string, string> = {
    ai_extraction: 'document extraction you confirmed',
    user_input: 'information you entered',
    user_confirmation: 'your confirmation',
    user_completion: 'your completion update',
    seed_demonstration: 'demonstration scenario source',
  };
  return labels[source] ?? source.replaceAll('_', ' ');
}
