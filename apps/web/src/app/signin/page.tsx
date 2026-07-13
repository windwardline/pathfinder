import { auth, signIn } from '@/auth';
import { redirect } from 'next/navigation';
import { Compass } from 'lucide-react';
import { TopoBackdrop } from '@/components/TopoBackdrop';

export const metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect('/');
  }
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col bg-paper lg:flex-row">
      {/* Brand panel */}
      <div className="relative flex flex-col justify-between overflow-hidden border-b border-hairline bg-spruce px-8 py-10 text-paper lg:w-1/2 lg:border-b-0 lg:border-r lg:px-14 lg:py-14">
        <TopoBackdrop className="pointer-events-none absolute inset-0 h-full w-full text-paper" />
        <div className="relative flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/40"
          >
            <Compass className="h-4.5 w-4.5" />
          </span>
          <span className="font-serif text-2xl tracking-tight">Pathfinder</span>
        </div>

        <div className="relative mt-14 lg:mt-0">
          <h1 className="max-w-md font-serif text-3xl leading-snug lg:text-[2.6rem] lg:leading-tight">
            Your reentry route: what comes next, why it comes next, and what it unlocks.
          </h1>
          <ul className="mt-8 max-w-md space-y-3 text-sm leading-relaxed text-paper/85">
            <li>One clear Focus Action at a time — never an overwhelming list.</li>
            <li>Every step explains itself, backed by facts you confirmed.</li>
            <li>When circumstances change, your Route recalculates and shows exactly what moved.</li>
          </ul>
        </div>

        <p className="relative mt-14 text-xs text-paper/60 lg:mt-0">
          Your data belongs to you. Nothing is shared unless you share it.
        </p>
      </div>

      {/* Sign-in form */}
      <div className="flex flex-1 items-center justify-center px-6 py-16 lg:px-14">
        <div className="w-full max-w-sm">
          <h2 className="font-serif text-2xl tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Enter your email and we&apos;ll send you a secure sign-in link. No password to
            remember.
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">
              {error === 'Verification'
                ? 'That sign-in link has expired or was already used. Request a new one below.'
                : 'Sign-in did not work. Please try again.'}
            </p>
          )}

          <form
            action={async (formData: FormData) => {
              'use server';
              await signIn('resend', {
                email: formData.get('email'),
                redirectTo: '/',
              });
            }}
            className="mt-6"
          >
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-hairline bg-surface px-4 py-3 text-sm placeholder:text-ink-faint focus:border-spruce focus:outline-none"
            />
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-spruce px-5 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90"
            >
              Email me a sign-in link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
