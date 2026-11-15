'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BlockContactButtonProps {
  contactId: string;
  initialBlocked: boolean;
  dealId?: string;
  disabled?: boolean;
}

export function BlockContactButton({
  contactId,
  initialBlocked,
  dealId,
  disabled,
}: BlockContactButtonProps) {
  const queryClient = useQueryClient();
  const [isBlocked, setIsBlocked] = useState(initialBlocked);

  useEffect(() => {
    setIsBlocked(initialBlocked);
  }, [initialBlocked]);

  const mutation = useMutation({
    mutationFn: async (action: 'block' | 'unblock') => {
      const res = await fetch(`/api/contacts/${contactId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        action?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось изменить блокировку');
      }

      return (data.action === 'block' ? 'block' : 'unblock') as
        | 'block'
        | 'unblock';
    },

    onSuccess: (action) => {
      setIsBlocked(action === 'block');

      queryClient.invalidateQueries({ queryKey: ['inbox-pipeline-deals'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-pipeline-count'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });   // ⬅️ добавлено
      queryClient.invalidateQueries({ queryKey: ['pipelines-with-stages'] });
      if (dealId) {
        queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      }

      toast.success(
        action === 'block' ? 'Клиент заблокирован' : 'Клиент разблокирован',
      );
    },

    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => mutation.mutate(isBlocked ? 'unblock' : 'block')}
      disabled={mutation.isPending || disabled}
      aria-pressed={isBlocked}
      className={cn(
        'w-full gap-2 rounded-xl text-xs font-semibold',
        isBlocked &&
          'border-destructive/30 text-destructive hover:bg-destructive/5',
      )}
    >
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : isBlocked ? (
        <ShieldOff className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Shield className="h-4 w-4" aria-hidden="true" />
      )}
      {isBlocked ? 'Разблокировать клиента' : 'Заблокировать клиента'}
    </Button>
  );
}