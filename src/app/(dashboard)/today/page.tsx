
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { TodayView } from '@/components/tasks/TodayView';

export const metadata = {
  title: 'Сегодня',
};

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/today')}`);
  }
  if (!session.user.organizationId) {
   
    redirect('/onboarding');
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Сегодня</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Что нужно сделать
        </p>
      </div>

      <TodayView />
    </div>
  );
}