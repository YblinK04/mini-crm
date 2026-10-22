'use client';

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError } from './api';
import { apiErrorMessage } from './utils';
import { useMessengerSettings } from './useMessengerSettings';
import { StatusCard } from './StatusCard';
import { CredentialsCard } from './CredentialsCard';
import { WebhookCard } from './WebhookCard';

export function MessengerSettingsForm() {
  const {
    statusQuery,
    status,
    botToken,
    setBotToken,
    webhookSecret,
    setWebhookSecret,
    baseUrl,
    setBaseUrl,
    saveMutation,
    testMutation,
    webhookMutation,
    deleteWebhookMutation,
  } = useMessengerSettings();

  if (statusQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Загрузка...
      </div>
    );
  }

  if (statusQuery.isError || !status) {
    const err = statusQuery.error;
    const message =
      err instanceof ApiError && err.status === 401
        ? 'Сессия истекла. Обновите страницу и войдите снова.'
        : err instanceof ApiError && err.status === 403
          ? 'Недостаточно прав для управления настройками Telegram.'
          : apiErrorMessage(err);

    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => statusQuery.refetch()}
            disabled={statusQuery.isFetching}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StatusCard status={status} />

      <CredentialsCard
        hasToken={status.hasTelegramToken}
        hasSecret={status.hasTelegramSecret}
        botToken={botToken}
        onBotTokenChange={setBotToken}
        webhookSecret={webhookSecret}
        onWebhookSecretChange={setWebhookSecret}
        onSave={() =>
          saveMutation.mutate({
            ...(botToken && { telegramBotToken: botToken }),
            ...(webhookSecret && { telegramWebhookSecret: webhookSecret }),
          })
        }
        isSaving={saveMutation.isPending}
        onTest={() => testMutation.mutate()}
        isTesting={testMutation.isPending}
      />

      <WebhookCard
        hasToken={status.hasTelegramToken}
        baseUrl={baseUrl}
        onBaseUrlChange={setBaseUrl}
        onSetWebhook={() => webhookMutation.mutate()}
        isSettingWebhook={webhookMutation.isPending}
        onDeleteWebhook={() => deleteWebhookMutation.mutate()}
        isDeletingWebhook={deleteWebhookMutation.isPending}
      />
    </div>
  );
}