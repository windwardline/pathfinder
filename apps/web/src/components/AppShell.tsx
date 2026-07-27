import Link from 'next/link';
import { Compass, ListTree, FileCheck2, History, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeLamp } from '@/components/ThemeLamp';
import { SignOutButton } from './SignOutButton';

const NAV = [
  { href: '/', label: 'Today', icon: Compass },
  { href: '/route', label: 'Route', icon: ListTree },
  { href: '/facts', label: 'Facts', icon: FileCheck2 },
  { href: '/history', label: 'Route History', icon: History },
  { href: '/account', label: 'Account', icon: UserRound },
];

export function AppShell({
  active,
  email,
  children,
}: {
  active: string;
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full bg-paper">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-spruce px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>
      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh w-60 shrink-0 flex-col justify-between overflow-y-auto border-r border-hairline">
        <div>
          <Link href="/" className="flex items-center gap-2.5 px-6 pt-7 pb-8">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-spruce text-paper"
            >
              <Compass className="h-4 w-4" />
            </span>
            <span className="font-serif text-xl tracking-tight">Pathfinder</span>
          </Link>

          <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={active === href ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active === href
                    ? 'bg-spruce-soft font-medium text-spruce-ink'
                    : 'text-ink-soft hover:bg-raised hover:text-ink'
                )}
              >
                <Icon className="h-4 w-4 opacity-80" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-hairline px-6 py-4">
          <ThemeLamp className="-ml-2 mb-2" />
          <p className="truncate text-xs text-ink-faint" title={email}>
            {email}
          </p>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-hairline bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-spruce text-paper"
          >
            <Compass className="h-3.5 w-3.5" />
          </span>
          <span className="font-serif text-lg tracking-tight">Pathfinder</span>
        </Link>
        <ThemeLamp />
      </div>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-hairline bg-paper/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active === href ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px]',
              active === href ? 'font-medium text-spruce' : 'text-ink-faint'
            )}
          >
            <Icon className="h-5 w-5" />
            {label === 'Route History' ? 'History' : label}
          </Link>
        ))}
      </nav>

      <main id="main-content" className="flex-1 pb-24 pt-16 md:pb-12 md:pt-0">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-12">{children}</div>
      </main>
    </div>
  );
}
