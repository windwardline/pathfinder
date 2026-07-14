'use client';

import { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { api } from '@/lib/client-api';

/** Requests the authenticated server export after an explicit second step. */
export function ExportDataButton() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await api.exportData();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'pathfinder-export.json';
      anchor.click();
      URL.revokeObjectURL(url);
      setConfirming(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The export could not be created.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-hairline px-4 py-2.5 text-sm text-ink transition-colors hover:bg-raised"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export my data
        </button>
      ) : (
        <div className="rounded-xl border border-hairline bg-raised p-4">
          <p className="text-sm leading-relaxed text-ink-soft">
            This creates a JSON file containing your account, Facts, Provenance, current Route,
            and Route History.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={exportData}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-spruce px-4 py-2.5 text-sm font-medium text-paper disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Confirm export
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="rounded-lg px-4 py-2.5 text-sm text-ink-soft hover:bg-surface disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-brick">
          {error}
        </p>
      )}
    </div>
  );
}
