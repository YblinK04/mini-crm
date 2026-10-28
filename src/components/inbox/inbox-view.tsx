'use client';

import { useState, type MouseEvent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  MessageSquare,
  Loader2,
  User,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Chat } from '../messages/Chat';
import { useInbox } from './useInbox';

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDistanceToNow(d, { addSuffix: true, locale: ru });
}

export function InboxView() {
  const {
    deals,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
    selectedDealId,
    setSelectedDealId,
    selectedDeal,
    deleteDeal,
    isDeleting,
  } = useInbox();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = () => {
    if (!selectedDealId) return;
    deleteDeal(selectedDealId, {
      onSettled: () => setIsDeleteDialogOpen(false),
    });
  };

  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    handleConfirmDelete();
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Загрузка" />
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error && error.message === 'unauthorized'
        ? 'Сессия истекла. Обновите страницу.'
        : 'Не удалось загрузить диалоги.';

    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm">{message}</p>
        {error instanceof Error && error.message !== 'unauthorized' && (
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
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
        <MessageSquare className="h-10 w-10 mb-4 opacity-20" aria-hidden="true" />
        <p>У вас пока нет активных диалогов.</p>
      </div>
    );
  }

  const isMobileChatOpen = Boolean(selectedDealId);

  return (
    <>
      <div className="flex h-[calc(100dvh-140px)] md:h-[calc(100vh-200px)] border rounded-none md:rounded-2xl overflow-hidden bg-background flex-col md:flex-row">
        
        <div className={cn("w-full md:w-1/3 border-r flex flex-col min-w-0", isMobileChatOpen && "hidden md:flex")}>
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
                    isActive ? 'bg-primary/5 border-l-primary' : 'hover:bg-muted/30 border-l-transparent',
                  )}
                >
                  <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground mt-0.5">
                    <User className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1 gap-2">
                      <span className="font-semibold text-sm truncate">{displayName}</span>
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

        <div className={cn("flex-1 flex flex-col min-w-0", !isMobileChatOpen && "hidden md:flex")}>
          {selectedDealId && selectedDeal ? (
            <div className="flex-1 flex flex-col min-h-0">
              
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/10 shrink-0">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDealId(null)}
                    className="-ml-2 text-muted-foreground hover:text-foreground md:hidden"
                  >
                    <ChevronLeft className="h-5 w-5 mr-0.5" />
                    Назад
                  </Button>
                  <span className="hidden md:inline-block text-sm font-semibold truncate px-2">
                    {selectedDeal.title}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                  className="shrink-0 gap-1.5 h-8 rounded-lg text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Удалить</span>
                </Button>
              </div>

              <div className="flex-1 flex flex-col p-3 md:p-4 min-h-0 overflow-hidden">
                <Chat
                  dealId={selectedDealId}
                  webToken={selectedDeal.publicToken ?? null}
                  hasTelegramContact={Boolean(selectedDeal.contacts?.[0]?.telegramChatId)}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить диалог?</AlertDialogTitle>
            <AlertDialogDescription>
              Вместе с ним будут безвозвратно удалены сама сделка и вся история сообщений. 
              Публичная ссылка на веб-чат станет недействительной. 
              <br /><br />
              <strong>Это действие нельзя отменить.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}