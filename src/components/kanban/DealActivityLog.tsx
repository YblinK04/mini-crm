'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ClockIcon, ArrowRightLeftIcon, DollarSignIcon, MessageSquareIcon } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils'; 

interface ExpandedActivityLog {
  id: string;
  content: string;
  type: 'NOTE' | 'SYSTEM_STAGE' | 'SYSTEM_BUDGET' | 'SYSTEM_TASK';
  dealId: string;
  userId: string;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  } | null;
}

interface DealActivityLogProps {
  dealId: string;
  pipelineId: string;
}

export function DealActivityLog({ dealId, pipelineId }: DealActivityLogProps) {
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState('');

  const { data: activities = [], isLoading } = useQuery<ExpandedActivityLog[]>({
    queryKey: ['deal-activities', dealId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${dealId}`);
      if (!response.ok) throw new Error('Не удалось загрузить историю сделки');
      const dealData = await response.json();
      return dealData.activities || []; 
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/tasks/${dealId}/comments`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, dealId }),
      });
      if (!response.ok) throw new Error('Ошибка при сохранении заметки');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] });
      setNoteContent('');
      toast.success('Заметка добавлена в ленту');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = () => {
    if (!noteContent.trim()) return;
    createNoteMutation.mutate(noteContent);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'SYSTEM_STAGE':
        return <ArrowRightLeftIcon className="w-3.5 h-3.5 text-blue-500" />;
      case 'SYSTEM_BUDGET':
        return <DollarSignIcon className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <MessageSquareIcon className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[450px]">
      <h3 className="font-semibold text-sm tracking-tight border-b pb-2">История сделки и заметки</h3>

      <ScrollArea className="flex-1 pr-2">
        {isLoading ? (
          <div className="text-center text-xs text-muted-foreground pt-4">Загрузка истории...</div>
        ) : activities.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground pt-4">История пуста. Здесь будут отображаться шаги по сделке.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {activities.map((log: ExpandedActivityLog) => (
              <div key={log.id} className="flex gap-3 text-xs">
                <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                  <AvatarImage src={log.user?.image || ''} />
                  <AvatarFallback>{log.user?.name?.slice(0, 2).toUpperCase() || 'МН'}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{log.user?.name || 'Система'}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 tabular-nums">
                      <ClockIcon className="w-3 h-3" />
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 bg-muted/40 rounded-lg p-2 border border-muted">
                    <div className="mt-0.5 shrink-0">{getActivityIcon(log.type)}</div>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{log.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="pt-2 border-t">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Добавить заметку по итогам разговора с клиентом..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-[60px] text-xs resize-none flex-1"
          />
          <Button 
            type="button" 
            size="sm" 
            className="text-xs h-9"
            onClick={onSubmit}
            disabled={createNoteMutation.isPending || !noteContent.trim()}
          >
            {createNoteMutation.isPending ? '...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
