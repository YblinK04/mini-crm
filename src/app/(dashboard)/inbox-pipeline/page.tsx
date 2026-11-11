import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { InboxList } from '@/components/inbox/inbox-list';

export const metadata = { title: 'Входящие' };

export default async function InboxPipelinePage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) redirect('/login');

  return (
    <div className="container max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span aria-hidden="true">📥</span> Входящие
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Новые заявки из всех каналов. Переместите в нужную воронку.
        </p>
      </div>
      <InboxList />
    </div>
  );
}