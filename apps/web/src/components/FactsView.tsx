'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, Plus, Check, X } from 'lucide-react';
import { api, FactRecord, RerouteRecord } from '@/lib/client-api';
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

  const actionFacts = (facts ?? []).filter(f => f.payload?.key === 'ACTION');
  const proposed = actionFacts.filter(f => f.status === 'PROPOSED');
  const confirmed = actionFacts.filter(f => f.status === 'CONFIRMED');

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

      <CaptureBox onCaptured={refresh} />

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
                className={cn(
                  'flex items-center justify-between gap-4 rounded-lg border border-hairline bg-surface px-4 py-3',
                  fact.payload?.value?.status === 'COMPLETED' && 'opacity-60'
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {fact.payload?.value?.title ?? 'Untitled fact'}
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
              </li>
            ))}
          </ul>
        )}
      </section>

      {reroute && <RerouteSummary reroute={reroute} onClose={() => setReroute(null)} />}
    </div>
  );
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
          <h3 className="mt-2.5 font-serif text-lg leading-snug">
            {fact.payload?.value?.title ?? 'Untitled fact'}
          </h3>
          {fact.payload?.value?.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {fact.payload.value.description}
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

function CaptureBox({ onCaptured }: { onCaptured: () => Promise<void> }) {
  const [mode, setMode] = useState<'paste' | 'manual'>('paste');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

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
        await api.proposeAction(title.trim(), description.trim());
        await onCaptured();
        setTitle('');
        setDescription('');
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
      <div role="tablist" aria-label="How to add facts" className="flex gap-1 rounded-lg bg-raised p-1">
        <TabButton active={mode === 'paste'} onClick={() => setMode('paste')}>
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Paste a document
        </TabButton>
        <TabButton active={mode === 'manual'} onClick={() => setMode('manual')}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add manually
        </TabButton>
      </div>

      {mode === 'paste' ? (
        <>
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
        </>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="manual-title" className="block text-sm text-ink-soft">
              What needs to happen?
            </label>
            <input
              id="manual-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Attend the housing interview on Friday"
              className="mt-1.5 w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm placeholder:text-ink-faint focus:border-spruce focus:outline-none"
            />
          </div>
          <div>
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
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-ink-faint">
          Everything you add starts as a Proposed Fact. Nothing affects your Route until you
          confirm it.
        </p>
        <button
          onClick={submit}
          disabled={busy || (mode === 'paste' ? !text.trim() : !title.trim())}
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
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
