'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { api } from '@/lib/client-api';

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.deleteAccount();
      window.location.assign('/signin?deleted=1');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Account deletion could not be completed.');
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-brick/25 bg-surface p-6">
      <h2 className="text-sm font-medium">Delete account</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        Permanently remove your account, Facts, Provenance, Route Versions, and active sessions.
        This cannot be undone.
      </p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brick/40 px-4 py-2.5 text-sm text-brick hover:bg-brick-soft"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Start account deletion
        </button>
      ) : (
        <div className="mt-4 rounded-xl bg-raised p-4">
          <label htmlFor="delete-confirmation" className="block text-sm text-ink-soft">
            Type <strong className="font-medium text-ink">DELETE MY ACCOUNT</strong> to confirm.
          </label>
          <input
            id="delete-confirmation"
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            autoComplete="off"
            className="mt-2 w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm focus:border-brick focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={deleteAccount}
              disabled={busy || confirmation !== 'DELETE MY ACCOUNT'}
              className="inline-flex items-center gap-2 rounded-lg bg-brick px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Permanently delete account
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setConfirmation('');
                setError(null);
              }}
              disabled={busy}
              className="rounded-lg px-4 py-2.5 text-sm text-ink-soft hover:bg-surface disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-brick">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
