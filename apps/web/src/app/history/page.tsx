import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { HistoryView } from '@/components/HistoryView';

export const metadata = { title: 'Route History' };

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/signin');
  }
  return (
    <AppShell active="/history" email={session.user.email}>
      <HistoryView />
    </AppShell>
  );
}
