import { RouteView } from '../components/RouteView';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Navigation, Settings, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();
  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-indigo-500/30">
      {/* Sidebar Rail */}
      <aside className="w-64 border-r border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/50 backdrop-blur-xl flex flex-col justify-between hidden md:flex z-10">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Navigation className="text-white w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight text-lg">Pathfinder</span>
          </div>

          <nav className="px-3 mt-6 space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-zinc-200/50 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 font-medium text-sm transition-colors">
              <LayoutDashboard className="w-4 h-4 opacity-70" />
              Overview
            </Link>
            <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 font-medium text-sm transition-colors">
              <Settings className="w-4 h-4 opacity-70" />
              Settings
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium border border-zinc-300 dark:border-zinc-700">
              {session.user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col flex-1 truncate">
              <span className="text-sm font-medium truncate">{session.user?.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto p-6 md:p-12 relative z-10">
          <header className="mb-12 flex justify-between items-end pb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Today&apos;s Route
              </h1>
              <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                Your deterministic sequence. Ingest information to watch the engine chart your optimal path.
              </p>
            </div>
          </header>
          
          <RouteView />
        </div>
      </main>
    </div>
  );
}
