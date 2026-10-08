
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { MessengerSettingsForm } from '@/components/settings/messenger/messenger-settings-form';

export const metadata = {
  title: 'Мессенджеры',
};

export default async function MessengersSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Мессенджеры</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Подключите Telegram-бота, чтобы принимать и отправлять сообщения
          прямо из CRM.
        </p>
      </div>

      <MessengerSettingsForm />
    </div>
  );
}