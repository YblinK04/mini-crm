import Link from 'next/link';
import { ArrowLeft, Server, Shield, Database, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Установка RealCRM' };

export default function InstallPage() {
  return (
    <div className="container max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            На главную
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Установка RealCRM</h1>
        <p className="text-muted-foreground mt-2">
          Пошаговая инструкция для системного администратора.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" aria-hidden="true" />
            Требования к серверу
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>VPS с <strong>2 GB RAM</strong>, 2 vCPU, 20 GB SSD</li>
            <li>Ubuntu 22.04 / 24.04 или Debian 12</li>
            <li>Домен (например, <code className="bg-muted px-1 rounded">crm.вашсайт.ru</code>)</li>
            <li>A-запись домена → IP сервера</li>
            <li>Стоимость: от 300–500 ₽/мес (Timeweb, VDSina, Reg.ru)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Быстрая установка (1 команда)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Войдите по SSH на сервер и выполните:</p>
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`# 1. Загрузите скрипт
wget https://raw.githubusercontent.com/ВАШ-USER/mini-crm/main/scripts/install.sh

# 2. Сделайте исполняемым
chmod +x install.sh

# 3. Запустите (замените на свои данные)
./install.sh crm.вашсайт.ru admin@вашсайт.ru Пароль123!`}
          </pre>
          <p className="text-muted-foreground">
            Через 5–10 минут система будет доступна по адресу{' '}
            <code className="bg-muted px-1 rounded">https://crm.вашсайт.ru</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" aria-hidden="true" />
            Что делает скрипт
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>Настраивает swap 2 GB</li>
            <li>Устанавливает Docker и Docker Compose</li>
            <li>Устанавливает Nginx + Let&apos;s Encrypt (SSL)</li>
            <li>Генерирует безопасные пароли в <code className="bg-muted px-1 rounded">.env</code></li>
            <li>Собирает Docker-образ и запускает контейнеры</li>
            <li>Применяет миграции БД</li>
            <li>Настраивает ежедневный бэкап (30 дней хранения)</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Обновление системы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`cd /opt/realcrm
git pull
docker compose build
docker compose up -d`}
          </pre>
          <p className="text-muted-foreground">
            Обновление занимает 3–5 минут. Данные сохраняются (volume <code>pgdata</code>).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" aria-hidden="true" />
            Бэкап и восстановление
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Автоматически:</strong> каждый день в 03:00 в <code className="bg-muted px-1 rounded">/opt/backups/</code>. Хранится 30 дней.</p>
          <p><strong>Вручную:</strong></p>
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`cd /opt/realcrm
docker compose exec -T postgres pg_dump -U crm crm > backup_$(date +%F).sql`}
          </pre>
          <p><strong>Восстановление:</strong></p>
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`cat backup_2026-11-17.sql | docker compose exec -T postgres psql -U crm crm`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            Что делать если не работает
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Сайт не открывается</p>
            <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
{`cd /opt/realcrm
docker compose ps
docker compose logs app --tail 50`}
            </pre>
          </div>
          <div>
            <p className="font-medium">SSL не выдался</p>
            <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
{`certbot --nginx -d crm.вашсайт.ru
nginx -t && systemctl reload nginx`}
            </pre>
          </div>
          <div>
            <p className="font-medium">Ошибка миграций</p>
            <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
{`docker compose exec app npx prisma migrate status`}
            </pre>
          </div>
          <p className="text-muted-foreground pt-2">
            Не помогло? Напишите на <strong>support@realcrm.ru</strong> с логом из{' '}
            <code className="bg-muted px-1 rounded">docker compose logs</code>.
          </p>
        </CardContent>
      </Card>

      <div className="text-center pt-4">
        <Button asChild>
          <Link href="/login">Перейти к входу</Link>
        </Button>
      </div>
    </div>
  );
}