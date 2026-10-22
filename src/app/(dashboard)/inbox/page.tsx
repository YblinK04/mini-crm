import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { InboxView } from '@/components/inbox/inbox-view';

export const metadata = {
  title: 'Чаты',
};

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/inbox')}`);
  }
  if (!session.user.organizationId) {
    redirect('/onboarding');
  }

  return (
    <div className="container max-w-6xl py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Чаты</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Все диалоги с клиентами в одном месте.
        </p>
      </div>

      <InboxView />
    </div>
  );
}