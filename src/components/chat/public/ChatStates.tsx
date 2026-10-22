'use client';

import { Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChatLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="h-6 w-6 animate-spin text-primary"
          aria-label="Загрузка"
        />
        <p className="text-xs text-muted-foreground">Загружаем чат...</p>
      </div>
    </div>
  );
}

export function ChatError({
  isNotFound,
  onRetry,
}: {
  isNotFound: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
        <MessageSquare
          className="h-8 w-8 text-muted-foreground/50"
          aria-hidden="true"
        />
      </div>
      {isNotFound ? (
        <>
          <p className="font-semibold text-foreground">Чат недоступен</p>
          <p className="text-sm mt-2 text-muted-foreground max-w-xs">
            Ссылка устарела или была отозвана. Попросите менеджера
            сгенерировать новую.
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold text-foreground">
            Не удалось загрузить чат
          </p>
          <p className="text-sm mt-2 text-muted-foreground max-w-xs">
            Проверьте соединение и попробуйте снова.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 rounded-full"
            onClick={onRetry}
          >
            Повторить
          </Button>
        </>
      )}
    </div>
  );
}

export function ChatEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Начните диалог
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Напишите ваш вопрос — менеджер скоро ответит
        </p>
      </div>
    </div>
  );
}