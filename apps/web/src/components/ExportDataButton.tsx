'use client';

import { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { api } from '@/lib/client-api';

/** Exports the user's facts, current Route, and Route History as JSON. */
export function ExportDataButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async () => {
    setBusy(true);
    setError(null);
    try {
      const [factsRes, routeRes, historyRes] = await Promise.all([
        api.getFacts(),
        api.getRoute(),
        api.getHistory(),
      ]);
      const blob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              facts: factsRes.facts,
              route: routeRes.route,
              history: historyRes.history,
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pathfinder-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The export could not be created.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={exportData}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-hairline px-4 py-2.5 text-sm text-ink transition-colors hover:bg-raised disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        Export my data
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-brick">
          {error}
        </p>
      )}
    </div>
  );
}
