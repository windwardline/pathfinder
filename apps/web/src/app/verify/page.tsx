import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { VERIFICATION_CALLBACK_PATH, parseVerificationCallback } from '@/lib/magic-link';

export const metadata: Metadata = {
  title: 'Continue signing in',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const callback = parseVerificationCallback(callbackUrl);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-2.5 text-spruce">
          <Compass className="h-5 w-5" aria-hidden="true" />
          <span className="font-serif text-xl text-ink">Pathfinder</span>
        </div>
        <h1 className="mt-8 font-serif text-3xl tracking-tight">Continue signing in</h1>
        {callback ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Select continue to finish signing in. This keeps your link single-use while preventing
              automated email previews from consuming it before you arrive.
            </p>
            {/* A plain GET form, deliberately: the browser itself must make this
                request. A server action would have Next.js resolve the redirect
                internally, so the session cookie Auth.js sets would never leave
                the server while the single-use token was spent regardless. */}
            <form method="GET" action={VERIFICATION_CALLBACK_PATH} className="mt-7">
              <input type="hidden" name="callbackUrl" value={callback.callbackUrl} />
              <input type="hidden" name="token" value={callback.token} />
              <input type="hidden" name="email" value={callback.email} />
              <button
                type="submit"
                className="w-full rounded-xl bg-spruce px-5 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90"
              >
                Continue to Pathfinder
              </button>
            </form>
          </>
        ) : (
          <>
            <p role="alert" className="mt-3 text-sm leading-relaxed text-brick">
              This sign-in link is incomplete or invalid. Request a new link to continue safely.
            </p>
            <Link
              href="/signin"
              className="mt-7 inline-block rounded-xl bg-spruce px-5 py-3 text-sm font-medium text-paper"
            >
              Request a new link
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
