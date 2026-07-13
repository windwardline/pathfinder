import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { RoutePageView } from '@/components/RoutePageView';

export const metadata = { title: 'Route' };

export default async function RoutePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/signin');
  }
  return (
    <AppShell active="/route" email={session.user.email}>
      <RoutePageView />
    </AppShell>
  );
}
