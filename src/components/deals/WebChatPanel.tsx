'use client';

import { useState } from 'react';
import { Link2, Loader2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { WebChatStatus } from './types';

interface WebChatPanelProps {
  dealId: string;
  status: WebChatStatus | undefined;
  isLoading: boolean;
  onInvalidate: () => void;
}

export function WebChatPanel({
  dealId,
  status,
  isLoading,
  onInvalidate,
}: WebChatPanelProps) {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const handleCopyLink = async () => {
    if (isGeneratingLink) return;

    setIsGeneratingLink(true);
    setFallbackUrl(null);

    try {
      const res = await fetch(`/api/deals/${dealId}/token`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('request_failed');

      const { token } = (await res.json()) as { token: string };
      const url = `${window.location.origin}/chat/${token}`;

      try {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка на веб-чат скопирована');
      } catch {
       
        setFallbackUrl(url);
      }

      onInvalidate();
    } catch {
      toast.error('Не удалось сгенерировать ссылку');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleRevokeLink = async () => {
    if (isRevoking) return;
    if (
      !window.confirm('Отозвать ссылку? Клиент потеряет доступ к веб-чату.')
    ) {
      return;
    }

    setIsRevoking(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/token`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('request_failed');

      setFallbackUrl(null);
      onInvalidate();
      toast.success('Ссылка отозвана');
    } catch {
      toast.error('Не удалось отозвать ссылку');
    } finally {
      setIsRevoking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="text-xs text-muted-foreground">Загрузка статуса...</p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      {status?.token ? (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground max-w-[240px]">
              Ссылка активна. Любой, у кого она есть, может писать в веб-чат.
              {status.expiresAt && (
                <>
                  {' '}
                  Действует до{' '}
                  {new Date(status.expiresAt).toLocaleDateString('ru-RU')}.
                </>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleCopyLink}
                disabled={isGeneratingLink}
                className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
              >
                {isGeneratingLink ? (
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {isGeneratingLink ? 'Генерация...' : 'Скопировать'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRevokeLink}
                disabled={isRevoking}
                className="h-8 gap-1.5 rounded-lg text-xs font-semibold text-destructive hover:text-destructive"
              >
                {isRevoking ? (
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Unlink className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {isRevoking ? 'Отзыв...' : 'Отозвать'}
              </Button>
            </div>
          </div>

          {fallbackUrl && (
            <div className="space-y-1.5 pt-2 border-t border-amber-500/20">
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Не удалось скопировать автоматически. Скопируйте вручную:
              </p>
              <Input
                readOnly
                value={fallbackUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="font-mono text-xs h-8"
                aria-label="Ссылка на веб-чат"
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted-foreground max-w-[280px]">
            Сгенерируйте ссылку, чтобы клиент мог написать вам в веб-чате
            без Telegram.
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleCopyLink}
            disabled={isGeneratingLink}
            className="h-8 gap-1.5 rounded-lg text-xs font-semibold shrink-0"
          >
            {isGeneratingLink ? (
              <Loader2
                className="w-3.5 h-3.5 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isGeneratingLink ? 'Создание...' : 'Создать ссылку'}
          </Button>
        </div>
      )}
    </div>
  );
}