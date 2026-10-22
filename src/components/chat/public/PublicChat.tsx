'use client';

import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePublicChat } from './usePublicChat';
import { isChatMessage, groupByDay } from './utils';
import { ChatHeader } from './ChatHeader';
import { ChatError, ChatLoading, ChatEmpty } from './ChatStates';
import { DayDivider, MessageBubble } from './MessageBubble';

export function PublicChat({ token }: { token: string }) {
  const {
    data, isLoading, isError, error, refetch, send, text, setText, handleSend, scrollRef, textareaRef, handleScroll,
  } = usePublicChat(token);

  if (isLoading) return <ChatLoading />;

  if (isError || !data) {
    const reason = error instanceof Error ? error.message : '';
    return (
      <ChatError isNotFound={reason === 'not_found'} onRetry={() => refetch()} />
    );
  }

  const safeMessages = data.messages.filter(isChatMessage);
  const groups = groupByDay(safeMessages);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-950 text-foreground transition-colors duration-300">
      <ChatHeader organizationName={data.organization?.name ?? 'Чат'} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 bg-zinc-50 dark:bg-zinc-900 scrollbar-thin"
      >
        {safeMessages.length === 0 ? (
          <ChatEmpty />
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {groups.map((group) => (
              <div key={group.dayKey} className="space-y-3">
                {group.dayLabel && <DayDivider label={group.dayLabel} />}
                <div className="space-y-2">
                  {group.messages.map((msg, idx) => {
                    const prev = group.messages[idx - 1];
                    const showTail = !prev || prev.direction !== msg.direction;
                    return (
                      <MessageBubble key={msg.id} msg={msg} showTail={showTail} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800/80 shrink-0">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Напишите сообщение..."
            aria-label="Текст сообщения"
            className="min-h-[44px] max-h-[120px] resize-none text-[15px] rounded-xl bg-zinc-100 dark:bg-zinc-900 border-transparent dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-blue-500 px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
            rows={1}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            size="icon"
            className="h-[44px] w-[44px] shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
            aria-label="Отправить сообщение"
          >
            {send.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5 ml-0.5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}