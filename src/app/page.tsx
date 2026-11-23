import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Settings,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'RealCRM' };

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container max-w-4xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            <span className="font-bold text-lg">RealCRM</span>
          </div>
          <Button asChild size="sm">
            <Link href="/login">Войти</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Система установлена и готова к работе
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            RealCRM
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Войдите, чтобы начать вести клиентов и сделки.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg">
              <Link href="/login" className="flex items-center gap-2">
                Войти в систему
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/install" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Инструкция по установке
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Быстрый старт</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="font-medium">Войдите как администратор</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Используйте <code className="bg-muted px-1 rounded">MASTER_ADMIN_EMAIL</code> и <code className="bg-muted px-1 rounded">MASTER_ADMIN_PASSWORD</code> из <code className="bg-muted px-1 rounded">.env</code>. При первом входе аккаунт владельца создастся автоматически.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="font-medium">Настройте Telegram-бота</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Настройки → Мессенджеры → вставьте токен из <code className="bg-muted px-1 rounded">@BotFather</code>.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-medium">Настройте SMTP</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Настройки → Email → для Yandex/Mail.ru создайте «пароль приложения» в настройках почты.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <p className="font-medium">Создайте менеджеров</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Настройки → Пользователи → добавьте сотрудников с ролью «Менеджер».
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold tracking-tight mb-4">Частые вопросы</h2>
          <div className="space-y-3">
            {[
              {
                icon: MessageSquare,
                q: 'Как подключить Telegram?',
                a: 'Настройки → Мессенджеры → вставьте токен от @BotFather. Webhook установится автоматически.',
              },
              {
                icon: Settings,
                q: 'Почему не приходят email-уведомления?',
                a: 'Проверьте Настройки → Email. Для Yandex/Mail.ru нужен «пароль приложения», не основной пароль.',
              },
              {
                icon: Users,
                q: 'Как ограничить доступ менеджерам?',
                a: 'Менеджеры видят только сделки, контакты, задачи и чаты. Настройки, бэкап, экспорт — только у владельца.',
              },
              {
                icon: Zap,
                q: 'Клиент не может открыть веб-чат',
                a: 'Проверьте переменную PUBLIC_URL в .env — она должна содержать реальный домен (https://...), не localhost.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.q}</p>
                        <p className="text-muted-foreground text-xs mt-1">{item.a}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Версия */}
        <div className="text-center text-xs text-muted-foreground pt-8">
          RealCRM v0.1.0 · Если что-то не работает — <Link href="/install" className="underline hover:text-foreground">инструкция по устранению</Link> или напишите в поддержку.
        </div>
      </main>
    </div>
  );
}