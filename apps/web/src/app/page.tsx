import { RouteView } from '../components/RouteView';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="flex w-full max-w-4xl mx-auto flex-col px-6 py-12">
        <header className="mb-12 flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Pathfinder Today
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Your deterministic route for today.
            </p>
          </div>
          <div className="text-sm text-zinc-500">
            {session.user?.email}
          </div>
        </header>
        
        <RouteView />
      </main>
    </div>
  );
}
