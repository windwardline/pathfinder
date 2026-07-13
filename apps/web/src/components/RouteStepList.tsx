'use client';

import { useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { RouteStep } from '@/lib/client-api';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';

/**
 * The Route, drawn as a trail: a vertical route line with a marker per step.
 * Order comes from the Route Engine and is never rearranged client-side.
 */
export function RouteStepList({ steps }: { steps: RouteStep[] }) {
  const incomplete = steps.filter(s => s.status !== 'COMPLETED');
  const completed = steps.filter(s => s.status === 'COMPLETED');

  return (
    <div>
      <ol className="relative ml-4 border-none pl-8">
        {/* The route line */}
        <span
          aria-hidden="true"
          className="route-line absolute bottom-4 left-0 top-4 w-0.5 rounded-full"
        />
        {incomplete.map(step => (
          <RouteStepItem key={step.actionId} step={step} />
        ))}
      </ol>

      {completed.length > 0 && <CompletedGroup steps={completed} />}
    </div>
  );
}

function RouteStepItem({ step }: { step: RouteStep }) {
  const [open, setOpen] = useState(step.status === 'FOCUS');
  const isFocus = step.status === 'FOCUS';
  const isBlocked = step.status === 'BLOCKED';

  return (
    <li className="relative pb-8 last:pb-2">
      {/* Trail marker */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1.5 flex items-center justify-center rounded-full border-2',
          isFocus
            ? 'focus-marker -left-[42px] h-5 w-5 border-spruce bg-spruce'
            : isBlocked
              ? '-left-[39px] h-3.5 w-3.5 border-hairline bg-paper'
              : '-left-[39px] h-3.5 w-3.5 border-spruce bg-paper'
        )}
      />

      <div
        className={cn(
          'rounded-xl border bg-surface transition-colors',
          isFocus ? 'border-spruce/25' : 'border-hairline',
          isBlocked && 'opacity-80'
        )}
      >
        <button
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {isBlocked && <Lock className="h-3.5 w-3.5 shrink-0 text-amber" aria-hidden="true" />}
            <span
              className={cn(
                'truncate text-[15px]',
                isFocus ? 'font-serif text-lg' : isBlocked ? 'text-ink-soft' : 'text-ink'
              )}
            >
              {step.title}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2.5">
            <StatusBadge status={step.status} />
            <ChevronDown
              aria-hidden="true"
              className={cn('h-4 w-4 text-ink-faint transition-transform', open && 'rotate-180')}
            />
          </span>
        </button>

        {open && (
          <div className="border-t border-hairline px-5 pb-4 pt-3">
            {step.description && (
              <p className="text-sm leading-relaxed text-ink-soft">{step.description}</p>
            )}
            <p className="mt-2 text-sm leading-relaxed">
              <span className="font-serif italic text-ink-soft">Why it comes next. </span>
              {step.explanation}
            </p>
            {step.blockedBy.length > 0 && (
              <p className="mt-2 text-sm text-ink-soft">
                Waiting on: <span className="text-ink">{step.blockedBy.join(', ')}</span>
              </p>
            )}
            {step.unlocks.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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
            <p className="mt-3 font-mono text-[11px] tracking-wide text-ink-faint">
              {step.reasonCodes.join(' · ')}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

function CompletedGroup({ steps }: { steps: RouteStep[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ml-4 mt-2 pl-8">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm text-ink-faint hover:text-ink-soft"
      >
        <ChevronDown
          aria-hidden="true"
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
        {steps.length} completed {steps.length === 1 ? 'Action' : 'Actions'}
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {steps.map(step => (
            <li
              key={step.actionId}
              className="rounded-lg border border-hairline bg-surface px-4 py-2.5 text-sm text-ink-faint line-through decoration-hairline"
            >
              {step.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
