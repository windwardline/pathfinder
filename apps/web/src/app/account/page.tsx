import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ExportDataButton } from '@/components/ExportDataButton';
import { DeleteAccountSection } from '@/components/DeleteAccountSection';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/signin');
  }

  return (
    <AppShell active="/account" email={session.user.email}>
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">Account</p>
        <h1 className="mt-1.5 font-serif text-3xl tracking-tight md:text-4xl">
          Your data, your control
        </h1>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-hairline bg-surface p-6">
          <h2 className="text-sm font-medium">Signed in as</h2>
          <p className="mt-1 text-sm text-ink-soft">{session.user.email}</p>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/signin' });
            }}
            className="mt-4"
          >
            <button
              type="submit"
              className="rounded-lg border border-hairline px-4 py-2.5 text-sm text-ink transition-colors hover:bg-raised"
            >
              Sign out
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-hairline bg-surface p-6">
          <h2 className="text-sm font-medium">Privacy</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
            <li>Your facts, Route, and history belong to you and are visible only to you.</li>
            <li>Nothing is shared with anyone unless you explicitly share it.</li>
            <li>
              AI only proposes facts from text you paste — it never confirms facts, never orders
              your Route, and never sees anything you didn&apos;t provide.
            </li>
            <li>Every route-affecting fact keeps a traceable record of where it came from.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-hairline bg-surface p-6">
          <h2 className="text-sm font-medium">Export</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Download your Confirmed and Proposed Facts, your current Route, and your Route
            History as JSON.
          </p>
          <div className="mt-4">
            <ExportDataButton />
          </div>
        </section>

        <DeleteAccountSection />
      </div>
    </AppShell>
  );
}
