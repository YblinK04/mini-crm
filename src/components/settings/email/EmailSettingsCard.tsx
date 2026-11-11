'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Send } from 'lucide-react';
import { useEmailSettings } from './useEmailSettiings';
import { SmtpFields } from './SmtpFields';
import { NotificationFields } from './NotificationFields';

export function EmailSettingsCard() {
  const {
    data,
    isLoading,
    hasPassword,
    form,
    updateField,
    handlePortChange,
    isValidPort,
    isDirty,
    save,
    test,
    sendTest,
  } = useEmailSettings();

  if (isLoading) {
    return <div className="text-xs text-muted-foreground">Загрузка...</div>;
  }

  return (
    <Card className="border-none shadow-md bg-background">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
          Email-уведомления
        </CardTitle>
        <CardDescription className="text-xs">
          Получайте уведомления о новых заявках на почту.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <div>
            <Label className="text-sm font-medium">Включить уведомления</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Без настройки SMTP уведомления не отправляются
            </p>
          </div>
          <input
            type="checkbox"
            checked={form.emailNotificationsEnabled}
            onChange={(e) =>
              updateField('emailNotificationsEnabled', e.target.checked)
            }
            className="h-5 w-5 rounded border-input accent-primary cursor-pointer"
            aria-label="Включить email-уведомления"
          />
        </div>

        <SmtpFields
          form={form}
          onChange={updateField}
          onPortChange={handlePortChange}
          isValidPort={isValidPort}
          hasPassword={hasPassword}
          lastTest={data ?? null}
        />

        <NotificationFields form={form} onChange={updateField} />

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || !isValidPort}
            title={!isValidPort ? 'Укажите порт 1–65535' : undefined}
          >
            {save.isPending ? (
              <Loader2
                className="h-4 w-4 animate-spin mr-2"
                aria-hidden="true"
              />
            ) : null}
            Сохранить
          </Button>

          <Button
            variant="outline"
            onClick={() => test.mutate()}
            disabled={test.isPending || isDirty}
            title={
              isDirty
                ? 'Сначала сохраните настройки'
                : 'Проверить подключение к SMTP'
            }
          >
            {test.isPending ? (
              <Loader2
                className="h-4 w-4 animate-spin mr-2"
                aria-hidden="true"
              />
            ) : null}
            Проверить SMTP
          </Button>

          <Button
            variant="outline"
            onClick={() => sendTest.mutate()}
            disabled={sendTest.isPending || isDirty}
            title={
              isDirty
                ? 'Сначала сохраните настройки'
                : 'Отправить тестовое письмо'
            }
          >
            {sendTest.isPending ? (
              <Loader2
                className="h-4 w-4 animate-spin mr-2"
                aria-hidden="true"
              />
            ) : (
              <Send className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            Тестовое письмо
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}