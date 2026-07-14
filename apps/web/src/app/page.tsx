import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { TodayView } from '@/components/TodayView';

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/signin');
  }
  return (
    <AppShell active="/" email={session.user.email}>
      <TodayView />
    </AppShell>
  );
}
