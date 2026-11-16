import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UsersList } from '@/components/settings/users/users-liist';

export const metadata = { title: 'Пользователи' };

export default async function UsersSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'OWNER') redirect('/settings');

  return (
    <div className="container max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Пользователи</h1>
        <p className="text-sm text-muted-foreground">
          Управление доступом сотрудников к системе.
        </p>
      </div>
      <UsersList currentUserId={session.user.id} />
    </div>
  );
}