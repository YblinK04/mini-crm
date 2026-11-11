'use client';

import { Loader2, Inbox } from 'lucide-react';

export function InboxLoading() {
  return (
    <div role="status" aria-live="polite" className="flex justify-center py-20">
      <Loader2
        className="h-6 w-6 animate-spin text-muted-foreground"
        aria-hidden="true"
      />
      <span className="sr-only">Загрузка входящих…</span>
    </div>
  );
}

export function InboxEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl">
      <Inbox
        className="h-10 w-10 text-muted-foreground/30 mb-3"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">Входящих нет</p>
      <p className="text-xs text-muted-foreground/60 mt-1 text-center px-4">
        Новые заявки из Telegram и лид-форм появятся здесь
      </p>
    </div>
  );
}