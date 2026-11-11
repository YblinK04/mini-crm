import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { EmailSettingsCard } from '@/components/settings/email/EmailSettingsCard';

export const metadata = { title: 'Email-уведомления' };

export default async function EmailSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  if (!['OWNER', 'ADMIN'].includes(session.user.role ?? '')) {
    redirect('/settings');
  }

  return (
    <div className="container max-w-2xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Email-уведомления
        </h1>
        <p className="text-sm text-muted-foreground">
          Настройка SMTP и правил отправки писем.
        </p>
      </div>
      <EmailSettingsCard />
    </div>
  );
}