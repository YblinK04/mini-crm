'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import {
  useAutoReplySettings,
  AUTO_REPLY_MAX,
} from './useAutoReplySettings';

export function AutoReplyCard() {
  const {
    enabled,
    setEnabled,
    text,
    setText,
    isLoading,
    isError,
    isFetching,
    refetch,
    isPending,
    isDirty,
    canSave,
    enabledWithoutText,
    save,
  } = useAutoReplySettings();

  if (isLoading) {
    return (
      <Card className="border-none shadow-md bg-background">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2
            className="h-5 w-5 animate-spin text-muted-foreground"
            aria-label="Загрузка"
          />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-none shadow-md bg-background">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle
            className="h-6 w-6 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            Не удалось загрузить настройки автоматизации.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md bg-background">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle
            className="h-4 w-4 text-primary"
            aria-hidden="true"
          />
          Автоответ на первое сообщение
        </CardTitle>
        <CardDescription className="text-xs">
          Когда клиент пишет впервые, бот сразу ответит, что заявка принята.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Label
              htmlFor="auto-reply-enabled"
              className="text-sm font-medium cursor-pointer"
            >
              Включить автоответ
            </Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Клиент получит мгновенный ответ
            </p>
          </div>
          <Switch
            id="auto-reply-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="auto-reply-text" className="text-xs">
            Текст автоответа
          </Label>
          <Textarea
            id="auto-reply-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Здравствуйте, {{имя}}! Мы получили вашу заявку и ответим в течение 15 минут."
            className="min-h-[100px] resize-none text-sm"
            maxLength={AUTO_REPLY_MAX}
            disabled={isPending}
            aria-invalid={enabledWithoutText}
            aria-describedby={
              enabledWithoutText ? 'auto-reply-error' : 'auto-reply-hint'
            }
          />
          {enabledWithoutText ? (
            <p
              id="auto-reply-error"
              className="text-[11px] text-destructive"
            >
              Заполните текст, чтобы включить автоответ.
            </p>
          ) : (
            <p
              id="auto-reply-hint"
              className="text-[11px] text-muted-foreground"
            >
              Используйте{' '}
              <code className="bg-muted px-1 rounded">{'{{имя}}'}</code>{' '}
              для подстановки имени клиента.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={save}
            disabled={!canSave}
            className="w-full sm:w-auto"
          >
            {isPending && (
              <Loader2
                className="h-4 w-4 animate-spin mr-2"
                aria-hidden="true"
              />
            )}
            Сохранить
          </Button>
          {isDirty && !enabledWithoutText && (
            <span className="text-[11px] text-muted-foreground">
              Есть несохранённые изменения
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}