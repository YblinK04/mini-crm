'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SettingsStatus } from './api';

export function StatusCard({ status }: { status: SettingsStatus }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Статус подключения
          {status.hasTelegramToken ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Подключён
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="w-3 h-3" />
              Не настроен
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Бот">
          {status.telegramBotUsername ? `@${status.telegramBotUsername}` : '—'}
        </Row>
        <Row label="Токен">
          {status.hasTelegramToken ? '✅ сохранён' : '❌ нет'}
        </Row>
        <Row label="Webhook-секрет">
          {status.hasTelegramSecret ? '✅ сохранён' : '❌ нет'}
        </Row>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}