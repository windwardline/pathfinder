'use client';

import { useRef, useState } from 'react';
import { Loader2, Route } from 'lucide-react';
import { api } from '@/lib/client-api';
import {
  DEMONSTRATION_SCENARIO_CATALOG,
  DemonstrationScenarioId,
} from '@/lib/demo-scenario-catalog';

/** User-controlled reset surface for fictional evaluation data. */
export function DemonstrationScenarioPanel() {
  const [scenarioId, setScenarioId] = useState<DemonstrationScenarioId>('SD-001');
  const scenarioIdRef = useRef<DemonstrationScenarioId>('SD-001');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scenario = DEMONSTRATION_SCENARIO_CATALOG.find(item => item.id === scenarioId)!;

  const replace = async () => {
    const selectedScenarioId = scenarioIdRef.current;
    setBusy(true);
    setError(null);
    try {
      await api.seedDemo(selectedScenarioId, true);
      // A query marker forces a fresh document request instead of allowing a
      // prefetched App Router response to show the Route that was just replaced.
      window.location.assign(`/?demonstration=${selectedScenarioId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The demonstration could not be loaded.');
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-spruce/20 bg-surface p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-spruce-soft p-2 text-spruce">
          <Route className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-medium">Demonstration mode</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Explore a fictional reentry scenario from a known starting point. No real participant
            information is included.
          </p>
        </div>
      </div>

      <label htmlFor="account-demonstration-scenario" className="mt-5 block text-xs font-medium text-ink-soft">
        Scenario
      </label>
      <select
        id="account-demonstration-scenario"
        value={scenarioId}
        onChange={event => {
          const nextScenarioId = event.target.value as DemonstrationScenarioId;
          scenarioIdRef.current = nextScenarioId;
          setScenarioId(nextScenarioId);
          setConfirmed(false);
        }}
        className="mt-1.5 w-full rounded-lg border border-hairline bg-paper px-3 py-2.5 text-sm focus:border-spruce focus:outline-none"
      >
        {DEMONSTRATION_SCENARIO_CATALOG.map(item => (
          <option key={item.id} value={item.id}>
            {item.id} — {item.title}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs leading-relaxed text-ink-faint">{scenario.objective}</p>
      <p className="mt-3 rounded-lg bg-raised px-3 py-2 text-xs leading-relaxed text-ink-soft">
        <span className="font-medium text-ink">Next:</span> {scenario.nextStep}
      </p>

      <label className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={event => setConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-hairline accent-spruce"
        />
        <span>I understand this replaces my current Route data with fictional demonstration data.</span>
      </label>

      <button
        onClick={replace}
        disabled={!confirmed || busy}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-spruce px-4 py-2.5 text-sm font-medium text-paper disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Load this demonstration
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-brick">{error}</p>}
    </section>
  );
}
