import Link from 'next/link';
import { Compass } from 'lucide-react';

export const metadata = { title: 'Privacy and trust' };

export default function PrivacyPage() {
  return (
    <main id="main-content" className="min-h-dvh bg-paper px-6 py-12 md:py-20">
      <article className="mx-auto max-w-2xl">
        <Link href="/signin" className="inline-flex items-center gap-2 text-spruce">
          <Compass className="h-5 w-5" aria-hidden="true" />
          <span className="font-serif text-xl text-ink">Pathfinder</span>
        </Link>
        <p className="mt-12 text-xs font-medium uppercase tracking-widest text-ink-faint">Privacy and trust</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight">Your Route begins with your control.</h1>
        <p className="mt-5 text-base leading-relaxed text-ink-soft">
          Pathfinder is built for people navigating reentry after incarceration. It helps organize
          confirmed circumstances into an explainable Route; it does not make legal determinations,
          score personal risk, or give hidden access to authorities or organizations.
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="font-serif text-2xl text-ink">What Pathfinder keeps</h2>
            <p className="mt-3">
              Pathfinder stores your account email, the Facts you enter or confirm, their
              Provenance, and the Route Versions needed to explain changes over time. It collects
              only information used to build, explain, update, export, or protect your Route.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-ink">How AI is bounded</h2>
            <p className="mt-3">
              Text you paste is sent to the configured extraction provider to identify candidate
              Facts. Extracted source excerpts may be retained as Provenance. Every result begins
              as a Proposed Fact: AI cannot confirm it, prioritize it, or order your Route.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-ink">What you control</h2>
            <p className="mt-3">
              You decide which Proposed Facts become Confirmed Facts. From Account, you can export
              your data, replace it with a clearly labeled fictional demonstration, or permanently
              delete your account and active sessions. Pathfinder does not disclose your Route to
              employers, service organizations, or public agencies. Text is sent to the configured
              extraction provider only when you choose to paste it for AI-assisted extraction.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-ink">Security reports</h2>
            <p className="mt-3">
              Report security concerns privately through the repository&apos;s GitHub Security
              Advisory workflow. Never place credentials, personal information, or participant
              records in a public issue.
            </p>
          </section>
        </div>

        <Link href="/signin" className="mt-12 inline-block rounded-xl bg-spruce px-5 py-3 text-sm font-medium text-paper">
          Return to sign in
        </Link>
      </article>
    </main>
  );
}
