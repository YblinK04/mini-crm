
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { AutoReplyCard } from '@/components/settings/automation/auto-reply-card';

export const metadata = { title: 'Автоматизация' };

export default async function AutomationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/settings/automation')}`);
  }
  if (!session.user.organizationId) {
    redirect('/onboarding');
  }

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(
    session.user.role ?? '',
  );
  if (!isOwnerOrAdmin) {
    redirect('/settings');
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div className="space-y-3">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Назад к настройкам</span>
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Автоматизация</h1>
          <p className="text-sm text-muted-foreground">
            Настройте автоматические действия, чтобы не забывать о клиентах.
          </p>
        </div>
      </div>

      <AutoReplyCard />
    </div>
  );
}