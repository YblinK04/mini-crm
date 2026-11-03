'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const AUTO_REPLY_MAX = 4000;

export interface AutomationSettings {
  autoReplyEnabled: boolean;
  autoReplyText: string;
}

const QUERY_KEY = ['automation-settings'] as const;

export function useAutoReplySettings() {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('');

  const query = useQuery<AutomationSettings>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/settings/automation');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      return res.json();
    },
  });
  useEffect(() => {
    if (query.data) {
      setEnabled(query.data.autoReplyEnabled);
      setText(query.data.autoReplyText);
    }
  }, [query.data]);


  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoReplyEnabled: enabled,
          autoReplyText: text.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const fieldErrors = body?.details?.fieldErrors as
          | Record<string, string[]>
          | undefined;
        const firstError = fieldErrors
          ? Object.values(fieldErrors).flat()[0]
          : undefined;
        throw new Error(firstError || body.error || 'Ошибка сохранения');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Настройки сохранены');
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Не удалось сохранить';
      toast.error(message);
    },
  });

  const save = useCallback(() => {
    if (saveMutation.isPending) return;
    saveMutation.mutate();
  }, [saveMutation]);

  const trimmed = text.trim();
  const enabledWithoutText = enabled && trimmed.length === 0;

  const isDirty = query.data
    ? enabled !== query.data.autoReplyEnabled ||
      trimmed !== (query.data.autoReplyText ?? '').trim()
    : false;

  const canSave =
    !enabledWithoutText && isDirty && !saveMutation.isPending;


  return {
    enabled,
    setEnabled,
    text,
    setText,

    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,

    isPending: saveMutation.isPending,

    isDirty,
    canSave,
    enabledWithoutText,

    save,
  };
}