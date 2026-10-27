'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/react-query';
import { Bell, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeTime, cn } from '@/lib/utils';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string | null; 
  read: boolean;
  createdAt: string;
}

export function NotificationsPopover() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/api/notifications'),
    refetchInterval: 30000, 
  });

  const { mutate: markAllAsRead, isPending } = useMutation({
    mutationFn: () => api.post('/api/notifications/read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      console.error('Не удалось прочитать уведомления');
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          type="button"
          variant="ghost" 
          size="icon" 
          className="relative group"
          aria-label={unreadCount > 0 ? `Уведомления (${unreadCount} новых)` : 'Уведомления'}
        >
          <Bell className={cn(
            "h-5 w-5 transition-all duration-300",
            unreadCount > 0 
              ? "text-red-600 fill-red-600/10 scale-110" 
              : "text-muted-foreground"
          )} />
          
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 border border-background"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-[calc(100vw-32px)] sm:w-80 p-0 border-none shadow-2xl bg-card/95 backdrop-blur-md" 
        align="end"
      >
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Уведомления
          </h4>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isPending}
              className="h-6 text-[10px] text-muted-foreground hover:text-primary px-2"
            >
              <Check className="w-3 h-3 mr-1" />
              Прочитать все
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-[10px] font-bold uppercase text-muted-foreground/30">
              Пусто
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => {
                const content = (
                  <div className={cn(
                    "p-4 border-b border-border/40 transition-colors",
                    !n.read && "bg-primary/5 hover:bg-primary/10"
                  )}>
                    <p className="text-xs font-bold">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{n.message}</p>
                    <p className="text-[9px] mt-2 opacity-40 italic">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                );

                if (n.link) {
                  return (
                    <Link key={n.id} href={n.link} className="block cursor-pointer">
                      {content}
                    </Link>
                  );
                }

                return <div key={n.id}>{content}</div>;
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}