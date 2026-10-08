import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { SettingsForm } from '@/components/settings/SettingsForm';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export const metadata = {
  title: 'Профиль',
};

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/settings/profile')}`);
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
          <h1 className="text-2xl font-bold tracking-tight">Профиль</h1>
          <p className="text-sm text-muted-foreground">
            Как вас видят другие пользователи.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-md bg-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">
            Имя пользователя
          </CardTitle>
          <CardDescription className="text-xs">
            Отображается в задачах и истории сделок.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}