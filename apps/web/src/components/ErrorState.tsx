'use client';

/**
 * Calm, explicit error state. Explains what happened and offers a retry —
 * a failure must never masquerade as "you're all caught up."
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-hairline bg-surface px-8 py-10 text-center"
    >
      <h2 className="font-serif text-xl">That didn&apos;t load</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 rounded-lg border border-hairline px-5 py-2.5 text-sm text-ink transition-colors hover:bg-raised"
        >
          Try again
        </button>
      )}
    </div>
  );
}
