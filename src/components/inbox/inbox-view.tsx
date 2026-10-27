'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  MessageSquare,
  Loader2,
  User,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Chat } from '../messages/Chat';

interface InboxContact {
  firstName: string;
  lastName: string | null;
  telegramChatId: string | null;
}

interface InboxMessage {
  id: string;
  content: string;
  direction: 'IN' | 'OUT';
  channel: string;
  createdAt: string;
}

interface InboxDeal {
  id: string;
  title: string;
  publicToken: string | null;
  contacts: InboxContact[];
  messages: InboxMessage[];
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDistanceToNow(d, { addSuffix: true, locale: ru });
}

export function InboxView() {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const {
    data: deals = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery<InboxDeal[]>({
    queryKey: ['inbox'],
    queryFn: async () => {
      const res = await fetch('/api/inbox');
      if (!res.ok) {
        if (res.status === 401) throw new Error('unauthorized');
        throw new Error('server_error');
      }
      return res.json();
    },
    refetchInterval: 10_000,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message === 'unauthorized') return false;
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (deals.length === 0) return;
    if (window.innerWidth < 768) return;

    const stillExists =
      selectedDealId !== null && deals.some((d) => d.id === selectedDealId);

    if (!stillExists) {
      setSelectedDealId(deals[0].id);
    }
  }, [deals, selectedDealId]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Загрузка диалогов"
        />
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error && error.message === 'unauthorized'
        ? 'Сессия истекла. Обновите страницу и войдите снова.'
        : 'Не удалось загрузить диалоги.';

    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm">{message}</p>
        {error instanceof Error && error.message !== 'unauthorized' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Повторить
          </Button>
        )}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground">
        <MessageSquare
          className="h-10 w-10 mb-4 opacity-20"
          aria-hidden="true"
        />
        <p>У вас пока нет активных диалогов.</p>
      </div>
    );
  }

  const selectedDeal = deals.find((d) => d.id === selectedDealId);
  const isMobileChatOpen = Boolean(selectedDealId);

  return (
    <div className="flex h-[calc(100dvh-140px)] md:h-[calc(100vh-200px)] border rounded-none md:rounded-2xl overflow-hidden bg-background flex-col md:flex-row">
      
      <div 
        className={cn(
          "w-full md:w-1/3 border-r flex flex-col min-w-0",
          isMobileChatOpen && "hidden md:flex"
        )}
      >
        <div className="p-4 border-b bg-muted/20 shrink-0">
          <h2 className="font-bold text-sm">Все диалоги</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {deals.map((deal) => {
            const contact = deal.contacts[0];
            const lastMsg = deal.messages[0];
            const isActive = deal.id === selectedDealId;

            const displayName = contact
              ? `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ''}`
              : deal.title;

            return (
              <button
                key={deal.id}
                type="button"
                onClick={() => setSelectedDealId(deal.id)}
                className={cn(
                  'w-full text-left p-3 border-b border-l-4 transition-colors flex gap-3',
                  isActive
                    ? 'bg-primary/5 border-l-primary'
                    : 'hover:bg-muted/30 border-l-transparent',
                )}
              >
                <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground mt-0.5">
                  <User className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1 gap-2">
                    <span className="font-semibold text-sm truncate">
                      {displayName}
                    </span>
                    {lastMsg?.createdAt && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {lastMsg?.direction === 'OUT' ? 'Вы: ' : ''}
                    {lastMsg?.content ?? 'Нет сообщений'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !isMobileChatOpen && "hidden md:flex"
        )}
      >
        {selectedDealId && selectedDeal ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="md:hidden flex items-center p-2 border-b bg-muted/10 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDealId(null)}
                className="-ml-2 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                К списку чатов
              </Button>
            </div>

            <div className="flex-1 flex flex-col p-3 md:p-4 min-h-0 overflow-hidden">
              <Chat
                dealId={selectedDealId}
                webToken={selectedDeal.publicToken ?? null}
                hasTelegramContact={Boolean(
                  selectedDeal.contacts?.[0]?.telegramChatId
                )}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Выберите диалог
          </div>
        )}
      </div>
    </div>
  );
}