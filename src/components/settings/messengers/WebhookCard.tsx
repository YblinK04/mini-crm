'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { validateBaseUrl } from './utils';

interface Props {
  hasToken: boolean;
  baseUrl: string;
  onBaseUrlChange: (v: string) => void;
  onSetWebhook: () => void;
  isSettingWebhook: boolean;
  onDeleteWebhook: () => void;
  isDeletingWebhook: boolean;
}

export function WebhookCard({
  hasToken,
  baseUrl,
  onBaseUrlChange,
  onSetWebhook,
  isSettingWebhook,
  onDeleteWebhook,
  isDeletingWebhook,
}: Props) {
  const baseUrlError = baseUrl ? validateBaseUrl(baseUrl) : null;
  const canSetWebhook = Boolean(baseUrl) && !baseUrlError && !isSettingWebhook;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Webhook</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baseUrl">Публичный URL приложения</Label>
          <Input
            id="baseUrl"
            type="url"
            placeholder="https://ваш-домен.com"
            value={baseUrl}
            onChange={(e) => onBaseUrlChange(e.target.value)}
            aria-invalid={Boolean(baseUrlError)}
          />
          {baseUrlError ? (
            <p className="text-xs text-destructive">{baseUrlError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Telegram будет отправлять сообщения на{' '}
              <code className="bg-muted px-1 rounded">
                {baseUrl || '<URL>'}/api/webhooks/telegram
              </code>
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={onSetWebhook} disabled={!canSetWebhook}>
            {isSettingWebhook ? 'Установка...' : 'Установить webhook'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (
                window.confirm(
                  'Отключить webhook? Бот перестанет получать сообщения.',
                )
              ) {
                onDeleteWebhook();
              }
            }}
            disabled={isDeletingWebhook || !hasToken}
          >
            {isDeletingWebhook ? 'Отключение...' : 'Отключить webhook'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}