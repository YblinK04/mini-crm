'use client';

import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { generateSecret } from './utils';

interface Props {
  hasToken: boolean;
  hasSecret: boolean;
  botToken: string;
  onBotTokenChange: (v: string) => void;
  webhookSecret: string;
  onWebhookSecretChange: (v: string) => void;
  onSave: () => void;
  isSaving: boolean;
  onTest: () => void;
  isTesting: boolean;
}

export function CredentialsCard({
  hasToken,
  hasSecret,
  botToken,
  onBotTokenChange,
  webhookSecret,
  onWebhookSecretChange,
  onSave,
  isSaving,
  onTest,
  isTesting,
}: Props) {
  const canSave = Boolean(botToken || webhookSecret) && !isSaving;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Токен бота</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="botToken">Токен от @BotFather</Label>
          <Input
            id="botToken"
            type="password"
            autoComplete="off"
            placeholder={
              hasToken
                ? '•••• (сохранён, введите новый чтобы заменить)'
                : '7123456789:AAHdqTcvCH1v...'
            }
            value={botToken}
            onChange={(e) => onBotTokenChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookSecret">Webhook-секрет</Label>
          <div className="flex gap-2">
            <Input
              id="webhookSecret"
              type="password"
              autoComplete="off"
              placeholder={
                hasSecret
                  ? '•••• (сохранён, введите новый чтобы заменить)'
                  : 'минимум 16 символов: A–Z a–z 0–9 _ -'
              }
              value={webhookSecret}
              onChange={(e) => onWebhookSecretChange(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Сгенерировать случайный секрет"
              onClick={() => onWebhookSecretChange(generateSecret())}
            >
              <Wand2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Случайная строка для защиты от поддельных запросов. Допустимы
            только{' '}
            <code className="bg-muted px-1 rounded">A–Z a–z 0–9 _ -</code>,
            16–256 символов.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave} disabled={!canSave}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button
            variant="outline"
            onClick={onTest}
            disabled={isTesting || !hasToken}
          >
            {isTesting ? 'Проверка...' : 'Проверить бота'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}