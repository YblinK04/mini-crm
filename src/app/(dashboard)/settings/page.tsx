import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, MessageSquare, ChevronRight, type LucideIcon } from 'lucide-react';
import { auth } from '@/lib/auth';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Настройки',
};

interface SettingsSection {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const SECTIONS: SettingsSection[] = [
  {
    href: '/settings/profile',
    icon: User,
    title: 'Профиль',
    description: 'Имя пользователя, аватар',
  },
  {
    href: '/settings/messengers',
    icon: MessageSquare,
    title: 'Мессенджеры',
    description: 'Telegram, MAX, интеграции',
  },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/settings')}`);
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Управление вашим рабочим пространством.
        </p>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.href}
              href={section.href}
              className="group block"
            >
              <Card className="border-none shadow-sm bg-background transition-[background-color,box-shadow] hover:bg-muted/30 hover:shadow-md">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold tracking-tight">
                      {section.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {section.description}
                    </div>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}