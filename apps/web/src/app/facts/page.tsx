import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { FactsView } from '@/components/FactsView';

export const metadata = { title: 'Facts' };

export default async function FactsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/signin');
  }
  return (
    <AppShell active="/facts" email={session.user.email}>
      <FactsView />
    </AppShell>
  );
}
