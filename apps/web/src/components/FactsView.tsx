'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, Plus, Check, X, Pencil, CalendarX } from 'lucide-react';
import { api, FactPayload, FactRecord, RerouteRecord } from '@/lib/client-api';
import { StatusBadge } from './StatusBadge';
import { RerouteSummary } from './RerouteSummary';
import { ErrorState } from './ErrorState';
import { cn } from '@/lib/utils';

/**
 * Fact Confirmation: the trust boundary made visible. Proposed Facts are
 * reviewed with their evidence and provenance; only explicit confirmation
 * lets a fact affect the Route, and confirming may trigger a Reroute.
 */
export function FactsView() {
  const [facts, setFacts] = useState<FactRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reroute, setReroute] = useState<RerouteRecord | null>(null);
  const [busyFactId, setBusyFactId] = useState<string | null>(null);
  const [correctingFactId, setCorrectingFactId] = useState<string | null>(null);
  const [correctionTitle, setCorrectionTitle] = useState('');
  const [correctionDescription, setCorrectionDescription] = useState('');

  const refresh = useCallback(async () => {
    try {
      const { facts } = await api.getFacts();
      setFacts(facts);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Facts could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getFacts()
      .then(({ facts }) => {
        if (cancelled) return;
        setFacts(facts);
        setLoadError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : 'Facts could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const act = async (factId: string, action: 'confirm' | 'reject') => {
    setBusyFactId(factId);
    setNotice(null);
    try {
      if (action === 'confirm') {
        const result = await api.confirmFact(factId);
        await refresh();
        if (result.reroute) setReroute(result.reroute);
        else setNotice('Fact confirmed. Your Route is unchanged.');
      } else {
        await api.rejectFact(factId);
        await refresh();
        setNotice('Fact rejected. It will never affect your Route.');
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'That did not work. Please try again.');
    } finally {
      setBusyFactId(null);
    }
  };

  const beginCorrection = (fact: FactRecord) => {
    setCorrectingFactId(fact.id);
    setCorrectionTitle(fact.payload?.value?.title ?? '');
    setCorrectionDescription(fact.payload?.value?.description ?? '');
    setNotice(null);
  };

  const submitCorrection = async (factId: string) => {
    setBusyFactId(factId);
    setNotice(null);
    try {
      await api.supersedeFact(factId, {
        key: 'ACTION',
        value: {
          title: correctionTitle.trim(),
          description: correctionDescription.trim(),
          status: 'OPEN',
        },
      });
      await refresh();
      setCorrectingFactId(null);
      setNotice(
        'Your correction is a Proposed Fact. The current Confirmed Fact stays active until you confirm the correction.'
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'The correction could not be saved.');
    } finally {
      setBusyFactId(null);
    }
  };

  const expire = async (factId: string) => {
    setBusyFactId(factId);
    setNotice(null);
    try {
      const result = await api.expireFact(factId);
      await refresh();
      if (result.reroute) setReroute(result.reroute);
      else setNotice('Fact expired. Your Route is unchanged.');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'The Fact could not be expired.');
    } finally {
      setBusyFactId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading facts">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    );
  }
  if (loadError && !facts) {
    return <ErrorState message={loadError} onRetry={refresh} />;
  }

  const visibleFacts = (facts ?? []).filter(f => f.payload?.key !== 'DEPENDENCY');
  const proposed = visibleFacts.filter(f => f.status === 'PROPOSED');
  const confirmed = visibleFacts.filter(f => f.status === 'CONFIRMED');
  const inactive = visibleFacts.filter(f =>
    ['REJECTED', 'SUPERSEDED', 'EXPIRED'].includes(f.status)
  );

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">Facts</p>
        <h1 className="mt-1.5 font-serif text-3xl tracking-tight md:text-4xl">
          What your Route is built from
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
          Only Confirmed Facts affect your Route. Anything extracted or entered starts as a
          Proposed Fact and waits for your review.
        </p>
      </header>

      <CaptureBox facts={facts ?? []} onCaptured={refresh} />

      {notice && (
        <p role="status" className="mt-6 rounded-lg bg-raised px-4 py-3 text-sm text-ink-soft">
          {notice}
        </p>
      )}

      <section aria-labelledby="proposed-heading" className="mt-10">
        <h2 id="proposed-heading" className="flex items-center gap-2.5 text-sm font-medium">
          Awaiting your review
          {proposed.length > 0 && (
            <span className="rounded-full bg-amber-soft px-2 py-0.5 text-xs text-amber">
              {proposed.length}
            </span>
          )}
        </h2>
        {proposed.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-hairline px-5 py-6 text-sm text-ink-faint">
            Nothing to review. New facts you paste or add will appear here first.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs text-ink-faint">
              Confirming a fact may update your Route — you&apos;ll see exactly what changed.
            </p>
            <ul className="mt-4 space-y-4">
              {proposed.map(fact => (
                <ProposedFactCard
                  key={fact.id}
                  fact={fact}
                  busy={busyFactId === fact.id}
                  onConfirm={() => act(fact.id, 'confirm')}
                  onReject={() => act(fact.id, 'reject')}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="confirmed-heading" className="mt-12">
        <h2 id="confirmed-heading" className="text-sm font-medium">
          Confirmed Facts
        </h2>
        {confirmed.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">No Confirmed Facts yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {confirmed.map(fact => (
              <li
                key={fact.id}
                className="rounded-lg border border-hairline bg-surface px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block truncate text-sm">
                    {factTitle(fact)}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                      {factTypeLabel(fact)}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-ink-faint">
                    {(fact.provenance ?? [])
                      .map(p => p.source)
                      .filter((s, i, arr) => arr.indexOf(s) === i)
                      .join(' · ') || 'no provenance'}
                    </span>
                  </span>
                  <StatusBadge
                    status={fact.payload?.value?.status === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED'}
                  />
                </div>
                {fact.payload?.value?.status !== 'COMPLETED' && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3">
                    {fact.payload?.key === 'ACTION' && (
                      <button
                        onClick={() => beginCorrection(fact)}
                        disabled={busyFactId === fact.id}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-ink-soft hover:bg-raised disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Correct
                      </button>
                    )}
                    <button
                      onClick={() => expire(fact.id)}
                      disabled={busyFactId === fact.id}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-ink-soft hover:bg-raised disabled:opacity-50"
                    >
                      <CalendarX className="h-3.5 w-3.5" aria-hidden="true" />
                      No longer current
                    </button>
                  </div>
                )}
                {correctingFactId === fact.id && (
                  <div className="mt-3 rounded-lg bg-raised p-4">
                    <p className="text-xs leading-relaxed text-ink-soft">
                      Your correction will start as a Proposed Fact. The current version remains active until you confirm the replacement.
                    </p>
                    <label className="mt-3 block text-xs text-ink-soft" htmlFor={`correction-title-${fact.id}`}>
                      Corrected Action
                    </label>
                    <input
                      id={`correction-title-${fact.id}`}
                      value={correctionTitle}
                      onChange={event => setCorrectionTitle(event.target.value)}
                      maxLength={120}
                      className="mt-1 w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm focus:border-spruce focus:outline-none"
                    />
                    <label className="mt-3 block text-xs text-ink-soft" htmlFor={`correction-description-${fact.id}`}>
                      Helpful context
                    </label>
                    <input
                      id={`correction-description-${fact.id}`}
                      value={correctionDescription}
                      onChange={event => setCorrectionDescription(event.target.value)}
                      maxLength={500}
                      className="mt-1 w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm focus:border-spruce focus:outline-none"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => submitCorrection(fact.id)}
                        disabled={busyFactId === fact.id || !correctionTitle.trim()}
                        className="rounded-lg bg-spruce px-3 py-2 text-xs font-medium text-paper disabled:opacity-50"
                      >
                        Save Proposed correction
                      </button>
                      <button
                        onClick={() => setCorrectingFactId(null)}
                        disabled={busyFactId === fact.id}
                        className="rounded-lg px-3 py-2 text-xs text-ink-soft hover:bg-surface"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {inactive.length > 0 && (
        <section aria-labelledby="fact-history-heading" className="mt-12">
          <h2 id="fact-history-heading" className="text-sm font-medium">Fact history</h2>
          <p className="mt-1.5 text-xs text-ink-faint">
            These records remain visible for traceability and do not affect your current Route.
          </p>
          <ul className="mt-4 space-y-2">
            {inactive.map(fact => (
              <li key={fact.id} className="flex items-center justify-between gap-4 rounded-lg bg-raised px-4 py-3">
                <span className="truncate text-sm text-ink-soft">
                  {factTitle(fact)}
                </span>
                <StatusBadge status={fact.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {reroute && <RerouteSummary reroute={reroute} onClose={() => setReroute(null)} />}
    </div>
  );
}

function factTypeLabel(fact: FactRecord) {
  const labels: Record<string, string> = {
    ACTION: 'Action',
    GOAL: 'Goal',
    REQUIREMENT: 'Requirement',
    OBLIGATION: 'Obligation',
    CONSTRAINT: 'Constraint',
    DEADLINE: 'Deadline',
    BLOCKER: 'Blocker',
  };
  return labels[fact.payload?.key ?? ''] ?? 'Fact';
}

function factTitle(fact: FactRecord) {
  const value = fact.payload?.value;
  return value?.title ?? value?.description ?? `${factTypeLabel(fact)} Fact`;
}

function factDescription(fact: FactRecord) {
  const value = fact.payload?.value;
  if (value?.description) return value.description;
  if (fact.payload?.key === 'DEADLINE' && value?.dueAt) {
    return `Due ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value.dueAt))}`;
  }
  if (fact.payload?.key === 'GOAL' && value?.priority != null) {
    return `Priority ${value.priority} of 100`;
  }
  return factTitle(fact);
}

function ProposedFactCard({
  fact,
  busy,
  onConfirm,
  onReject,
}: {
  fact: FactRecord;
  busy: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const confidence = fact.provenance?.find(p => p.confidence != null)?.confidence;
  const source = fact.provenance?.[0]?.source;

  return (
    <li className="rounded-xl border border-amber/30 bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <StatusBadge status="PROPOSED" />
          {fact.supersedesFactId && (
            <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              Correction
            </span>
          )}
          <h3 className="mt-2.5 font-serif text-lg leading-snug">
            {factTitle(fact)}
          </h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            {factTypeLabel(fact)}
          </p>
          {factDescription(fact) && factDescription(fact) !== factTitle(fact) && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {factDescription(fact)}
            </p>
          )}
        </div>
      </div>

      {fact.payload?.sourceText && (
        <blockquote className="mt-3 border-l-2 border-hairline pl-3 text-sm italic leading-relaxed text-ink-faint">
          “{fact.payload.sourceText}”
        </blockquote>
      )}

      <p className="mt-3 font-mono text-[11px] tracking-wide text-ink-faint">
        {source === 'ai_extraction' ? 'Extracted by AI' : 'Entered by you'}
        {confidence != null && ` · confidence ${confidence}/100 — confidence is not confirmation`}
      </p>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-spruce px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Confirm
        </button>
        <button
          onClick={onReject}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-raised disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </button>
      </div>
    </li>
  );
}

type ManualFactKind = 'ACTION' | 'GOAL' | 'REQUIREMENT' | 'CONSTRAINT' | 'OBLIGATION' | 'DEADLINE' | 'BLOCKER';

const MANUAL_FACT_OPTIONS: Array<{ value: ManualFactKind; label: string; help: string }> = [
  { value: 'ACTION', label: 'An Action', help: 'Something you can do next.' },
  { value: 'GOAL', label: 'A Goal', help: 'An outcome you are working toward.' },
  { value: 'REQUIREMENT', label: 'A Requirement', help: 'Something that must be true before an Action.' },
  { value: 'CONSTRAINT', label: 'A Constraint', help: 'A circumstance affecting one of your Actions.' },
  { value: 'OBLIGATION', label: 'An Obligation', help: 'A commitment or appointment that must be protected.' },
  { value: 'DEADLINE', label: 'A Deadline', help: 'A due date tied to an Action.' },
  { value: 'BLOCKER', label: 'A Blocker', help: 'A condition preventing an Action right now.' },
];

function CaptureBox({ facts, onCaptured }: { facts: FactRecord[]; onCaptured: () => Promise<void> }) {
  const [mode, setMode] = useState<'paste' | 'manual'>('paste');
  const [text, setText] = useState('');
  const [kind, setKind] = useState<ManualFactKind>('ACTION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetActionId, setTargetActionId] = useState('');
  const [resolutionActionId, setResolutionActionId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [priority, setPriority] = useState(50);
  const [constraintType, setConstraintType] = useState('TRANSPORTATION');
  const [hardness, setHardness] = useState('HARD');
  const [severity, setSeverity] = useState('MODERATE');
  const [dateTime, setDateTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const actionOptions = facts.filter(
    fact => fact.status === 'CONFIRMED' && fact.payload?.key === 'ACTION' && fact.payload.value.status !== 'COMPLETED'
  );
  const goalOptions = facts.filter(
    fact => fact.status === 'CONFIRMED' && fact.payload?.key === 'GOAL' && fact.payload.value.status === 'ACTIVE'
  );
  const needsTarget = ['REQUIREMENT', 'CONSTRAINT', 'DEADLINE', 'BLOCKER'].includes(kind);
  const needsDate = ['OBLIGATION', 'DEADLINE'].includes(kind);

  const buildManualPayload = (): FactPayload => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (kind === 'ACTION') {
      return {
        key: 'ACTION',
        value: {
          title: cleanTitle,
          description: cleanDescription,
          status: 'OPEN',
          ...(goalId ? { goalId } : {}),
        },
      };
    }
    if (kind === 'GOAL') {
      return { key: 'GOAL', value: { title: cleanTitle, status: 'ACTIVE', priority } };
    }
    if (kind === 'REQUIREMENT') {
      return {
        key: 'REQUIREMENT',
        value: {
          description: cleanTitle,
          status: 'UNSATISFIED',
          hardness,
          targetActionId,
          ...(resolutionActionId ? { resolutionActionId } : {}),
        },
      };
    }
    if (kind === 'CONSTRAINT') {
      return {
        key: 'CONSTRAINT',
        value: {
          constraintType,
          description: cleanTitle,
          status: 'ACTIVE',
          targetActionIds: [targetActionId],
          ...(resolutionActionId ? { resolutionActionId } : {}),
        },
      };
    }
    if (kind === 'OBLIGATION') {
      return {
        key: 'OBLIGATION',
        value: {
          title: cleanTitle,
          status: 'ACTIVE',
          startAt: new Date(dateTime).toISOString(),
          ...(targetActionId ? { conflictActionIds: [targetActionId] } : {}),
          ...(resolutionActionId ? { resolutionActionId } : {}),
        },
      };
    }
    if (kind === 'DEADLINE') {
      return {
        key: 'DEADLINE',
        value: {
          title: cleanTitle,
          dueAt: new Date(dateTime).toISOString(),
          severity,
          targetActionId,
        },
      };
    }
    return {
      key: 'BLOCKER',
      value: {
        targetActionId,
        reasonCode: 'USER_CONFIRMED_BLOCKER',
        description: cleanTitle,
        active: true,
        ...(resolutionActionId ? { resolutionActionId } : {}),
      },
    };
  };

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      if (mode === 'paste') {
        const { facts } = await api.extract(text);
        await onCaptured();
        setText('');
        setMessage(
          facts.length === 0
            ? 'No actions were found in that text. You can add one manually instead.'
            : `${facts.length} Proposed ${facts.length === 1 ? 'Fact' : 'Facts'} ready for your review below.`
        );
      } else {
        await api.proposeFact(buildManualPayload());
        await onCaptured();
        setTitle('');
        setDescription('');
        setTargetActionId('');
        setResolutionActionId('');
        setGoalId('');
        setDateTime('');
        setMessage('Added as a Proposed Fact — review it below.');
      }
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : 'That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      <div
        role="tablist"
        aria-label="How to add facts"
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const nextMode =
            event.key === 'ArrowLeft' || event.key === 'Home' ? 'paste' : 'manual';
          setMode(nextMode);
          document.getElementById(`capture-tab-${nextMode}`)?.focus();
        }}
        className="flex gap-1 rounded-lg bg-raised p-1"
      >
        <TabButton
          id="capture-tab-paste"
          controls="capture-panel-paste"
          active={mode === 'paste'}
          onClick={() => setMode('paste')}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Paste a document
        </TabButton>
        <TabButton
          id="capture-tab-manual"
          controls="capture-panel-manual"
          active={mode === 'manual'}
          onClick={() => setMode('manual')}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add manually
        </TabButton>
      </div>

      {mode === 'paste' ? (
        <div
          id="capture-panel-paste"
          role="tabpanel"
          aria-labelledby="capture-tab-paste"
        >
          <label htmlFor="capture-text" className="mt-4 block text-sm text-ink-soft">
            Paste a job offer, housing letter, supervision schedule, or ID guidance. Pathfinder
            extracts the actions it finds as Proposed Facts for your review.
          </label>
          <textarea
            id="capture-text"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Paste the document text here…"
            className="mt-3 w-full resize-none rounded-xl border border-hairline bg-paper px-4 py-3 text-sm leading-relaxed placeholder:text-ink-faint focus:border-spruce focus:outline-none"
          />
        </div>
      ) : (
        <div
          id="capture-panel-manual"
          role="tabpanel"
          aria-labelledby="capture-tab-manual"
          className="mt-4 space-y-3"
        >
          <div>
            <label htmlFor="manual-kind" className="block text-sm text-ink-soft">
              What are you adding?
            </label>
            <select
              id="manual-kind"
              value={kind}
              onChange={event => {
                setKind(event.target.value as ManualFactKind);
                setTargetActionId('');
                setResolutionActionId('');
                setDateTime('');
              }}
              className="mt-1.5 w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm focus:border-spruce focus:outline-none"
            >
              {MANUAL_FACT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-faint">
              {MANUAL_FACT_OPTIONS.find(option => option.value === kind)?.help}
            </p>
          </div>
          <div>
            <label htmlFor="manual-title" className="block text-sm text-ink-soft">
              {kind === 'ACTION' ? 'What needs to happen?' : kind === 'GOAL' ? 'What outcome are you working toward?' : 'Describe this Fact'}
            </label>
            <input
              id="manual-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
              placeholder={kind === 'ACTION' ? 'e.g. Attend the housing interview on Friday' : 'Use a short, specific description'}
              className="mt-1.5 w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm placeholder:text-ink-faint focus:border-spruce focus:outline-none"
            />
          </div>
          {kind === 'ACTION' && <div>
            <label htmlFor="manual-description" className="block text-sm text-ink-soft">
              Helpful context <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="manual-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              placeholder="e.g. Bring your ID and the reference letter"
              className="mt-1.5 w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm placeholder:text-ink-faint focus:border-spruce focus:outline-none"
            />
          </div>}

          {kind === 'ACTION' && goalOptions.length > 0 && (
            <SelectFactReference id="manual-goal" label="Supports this Goal (optional)" value={goalId} onChange={setGoalId} facts={goalOptions} />
          )}

          {needsTarget && (
            <SelectFactReference id="manual-target" label="Affected Action" value={targetActionId} onChange={setTargetActionId} facts={actionOptions} required />
          )}

          {kind === 'OBLIGATION' && actionOptions.length > 0 && (
            <SelectFactReference id="manual-conflict" label="Action that may conflict (optional)" value={targetActionId} onChange={setTargetActionId} facts={actionOptions} />
          )}

          {['REQUIREMENT', 'CONSTRAINT', 'OBLIGATION', 'BLOCKER'].includes(kind) && actionOptions.length > 0 && (
            <SelectFactReference id="manual-resolution" label="Action that can resolve this (optional)" value={resolutionActionId} onChange={setResolutionActionId} facts={actionOptions} />
          )}

          {needsTarget && actionOptions.length === 0 && (
            <p role="status" className="rounded-lg bg-raised px-3 py-2 text-xs leading-relaxed text-ink-soft">
              Confirm at least one Action first, then connect this Fact to it.
            </p>
          )}

          {kind === 'GOAL' && (
            <label htmlFor="manual-priority" className="block text-sm text-ink-soft">
              Priority: {priority} of 100
              <input id="manual-priority" type="range" min="0" max="100" value={priority} onChange={event => setPriority(Number(event.target.value))} className="mt-2 block w-full accent-spruce" />
            </label>
          )}

          {kind === 'REQUIREMENT' && (
            <label htmlFor="manual-hardness" className="block text-sm text-ink-soft">Requirement type
              <select id="manual-hardness" value={hardness} onChange={event => setHardness(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm focus:border-spruce focus:outline-none">
                <option value="HARD">Must happen first</option><option value="SOFT">Helpful but not required</option>
              </select>
            </label>
          )}

          {kind === 'CONSTRAINT' && (
            <label htmlFor="manual-constraint-type" className="block text-sm text-ink-soft">Constraint type
              <select id="manual-constraint-type" value={constraintType} onChange={event => setConstraintType(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm focus:border-spruce focus:outline-none">
                {['TRANSPORTATION', 'TIME', 'FINANCIAL', 'LOCATION', 'AVAILABILITY', 'ACCESSIBILITY', 'POLICY'].map(value => <option key={value} value={value}>{value.charAt(0) + value.slice(1).toLowerCase()}</option>)}
              </select>
            </label>
          )}

          {kind === 'DEADLINE' && (
            <label htmlFor="manual-severity" className="block text-sm text-ink-soft">How strongly should this deadline affect the Route?
              <select id="manual-severity" value={severity} onChange={event => setSeverity(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm focus:border-spruce focus:outline-none">
                <option value="LOW">Low</option><option value="MODERATE">Moderate</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
              </select>
            </label>
          )}

          {needsDate && (
            <label htmlFor="manual-date-time" className="block text-sm text-ink-soft">
              {kind === 'DEADLINE' ? 'Due date and time' : 'Start date and time'}
              <input id="manual-date-time" type="datetime-local" value={dateTime} onChange={event => setDateTime(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm focus:border-spruce focus:outline-none" />
            </label>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-ink-faint">
          Everything you add starts as a Proposed Fact. Nothing affects your Route until you
          confirm it.
        </p>
        <button
          onClick={submit}
          disabled={busy || (mode === 'paste' ? !text.trim() : !title.trim() || (needsTarget && !targetActionId) || (needsDate && !dateTime))}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-spruce px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {mode === 'paste' ? 'Extracting…' : 'Adding…'}
            </>
          ) : mode === 'paste' ? (
            'Extract actions'
          ) : (
            'Add as Proposed Fact'
          )}
        </button>
      </div>

      {message && (
        <p
          role={isError ? 'alert' : 'status'}
          className={cn(
            'mt-4 rounded-lg px-4 py-3 text-sm',
            isError ? 'bg-brick-soft text-brick' : 'bg-raised text-ink-soft'
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}

function SelectFactReference({
  id,
  label,
  value,
  onChange,
  facts,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  facts: FactRecord[];
  required?: boolean;
}) {
  return (
    <label htmlFor={id} className="block text-sm text-ink-soft">
      {label}
      <select
        id={id}
        value={value}
        required={required}
        onChange={event => onChange(event.target.value)}
        className="mt-1.5 block w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm focus:border-spruce focus:outline-none"
      >
        <option value="">{required ? 'Choose an Action' : 'None selected'}</option>
        {facts.map(fact => (
          <option key={fact.id} value={fact.id}>{factTitle(fact)}</option>
        ))}
      </select>
    </label>
  );
}

function TabButton({
  id,
  controls,
  active,
  onClick,
  children,
}: {
  id: string;
  controls: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-controls={controls}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors',
        active ? 'bg-surface font-medium text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
      )}
    >
      {children}
    </button>
  );
}
