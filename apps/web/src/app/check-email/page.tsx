import { Compass } from 'lucide-react';
import { TopoBackdrop } from '@/components/TopoBackdrop';

export const metadata = { title: 'Check your email' };

export default function CheckEmailPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-paper px-6">
      <TopoBackdrop className="pointer-events-none absolute inset-0 h-full w-full text-spruce" />
      <div className="relative max-w-md text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-spruce text-paper"
        >
          <Compass className="h-5 w-5" />
        </span>
        <h1 className="mt-6 font-serif text-3xl tracking-tight">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          We sent you a sign-in link. It stays valid for 15 minutes — open it on this device to
          continue to your Route.
        </p>
        <a
          href="/signin"
          className="mt-8 inline-block text-sm text-spruce underline-offset-2 hover:underline"
        >
          Use a different email
        </a>
      </div>
    </div>
  );
}
