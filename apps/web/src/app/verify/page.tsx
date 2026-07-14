import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Compass } from 'lucide-react';
import { validateVerificationCallback } from '@/lib/magic-link';

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
  const valid = validateVerificationCallback(callbackUrl);

  async function continueSignIn() {
    'use server';
    const destination = validateVerificationCallback(callbackUrl);
    if (!destination) redirect('/signin?error=Verification');
    redirect(destination);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-2.5 text-spruce">
          <Compass className="h-5 w-5" aria-hidden="true" />
          <span className="font-serif text-xl text-ink">Pathfinder</span>
        </div>
        <h1 className="mt-8 font-serif text-3xl tracking-tight">Continue signing in</h1>
        {valid ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Select continue to finish signing in. This keeps your link single-use while preventing
              automated email previews from consuming it before you arrive.
            </p>
            <form action={continueSignIn} className="mt-7">
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
