'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ShieldOff,
  MessageCircleOff,
  Clock,
} from 'lucide-react';
import { usePublicChat } from './usePublicChat';
import { ChatHeader } from './ChatHeader';
import { DayDivider, MessageBubble } from './MessageBubble';
import { WelcomeNameForm } from './WelcomeNameForm';
import { ChatComposer } from '@/components/chat/shared/ChatComposer';
import { ChatLoading, ChatError, ChatEmpty } from './ChatStates';
import { groupByDay } from './utils';

interface PublicChatProps {
  token: string;
}

export function PublicChat({ token }: PublicChatProps) {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isError,
    refetch,
    activeData,
    isActive,
    send,
    scrollRef,
    handleScroll,
  } = usePublicChat(token);

  const messages = activeData?.messages ?? [];
  const groups = useMemo(() => groupByDay(messages), [messages]);

  const handleSend = async (content: string): Promise<unknown> => {
    if (!isActive) return null;
    const trimmed = content.trim();
    if (!trimmed) return null;
    try {
      return await send.mutateAsync(trimmed);
    } catch {
      return null;
    }
  };

  const handleNameSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['public-chat', token] });
  };

  if (isError) {
    return <ChatError isNotFound={false} onRetry={() => refetch()} />;
  }

  if (isLoading || !data) {
    return <ChatLoading />;
  }

  if (data.status === 'not_found') {
    return (
      <StatusScreen
        icon={<AlertCircle className="h-10 w-10 text-destructive/50" />}
        title="Чат не найден"
        text="Возможно, ссылка устарела или была удалена. Попросите менеджера создать новую."
      />
    );
  }

  if (data.status === 'blocked') {
    return (
      <StatusScreen
        icon={<ShieldOff className="h-10 w-10 text-destructive/50" />}
        title="Диалог заблокирован"
        text={`Компания «${data.organizationName || ''}» закрыла доступ к этому чату.`}
      />
    );
  }

  if (data.status === 'closed') {
    return (
      <StatusScreen
        icon={
          <MessageCircleOff className="h-10 w-10 text-muted-foreground/40" />
        }
        title="Чат закрыт"
        text="Менеджер завершил этот диалог. Если нужна помощь — свяжитесь с компанией напрямую."
      />
    );
  }

  if (data.status === 'expired') {
    return (
      <StatusScreen
        icon={<Clock className="h-10 w-10 text-muted-foreground/40" />}
        title="Ссылка устарела"
        text="Ссылка на этот чат больше не активна."
      />
    );
  }

  if (!activeData) return <ChatLoading />;

  const hasMessages = activeData.messages.length > 0;
  const needsName =
    !activeData.contactName || activeData.contactName === 'Клиент из чата';

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader organizationName={activeData.organization.name} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
      >
        {!hasMessages && needsName ? (
          <div className="flex items-center justify-center h-full">
            <WelcomeNameForm token={token} onSuccess={handleNameSuccess} />
          </div>
        ) : !hasMessages ? (
          <ChatEmpty />
        ) : (
          groups.map((group) => (
            <div key={group.dayKey} className="space-y-1">
              <DayDivider label={group.dayLabel} />
              {group.messages.map((m, i, arr) => {
                const prevDir = i > 0 ? arr[i - 1].direction : null;
                const showTail = prevDir === m.direction;
                return (
                  <MessageBubble key={m.id} msg={m} showTail={showTail} />
                );
              })}
            </div>
          ))
        )}
      </div>

      <ChatComposer onSend={handleSend} />
    </div>
  );
}


function StatusScreen({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
        {icon}
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm mt-2 text-muted-foreground max-w-xs leading-relaxed">
        {text}
      </p>
    </div>
  );
}