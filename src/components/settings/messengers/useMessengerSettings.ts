'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ApiError,
  QUERY_KEY,
  deleteWebhook,
  fetchStatus,
  saveCredentials,
  setWebhook,
  testBot,
} from './api';
import { apiErrorMessage } from './utils';

export function useMessengerSettings() {
  const qc = useQueryClient();

  const statusQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchStatus,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const status = statusQuery.data;

  const [botToken, setBotToken] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const baseUrlPrefilled = useRef(false);

  useEffect(() => {
    if (!baseUrlPrefilled.current && status?.publicUrl) {
      setBaseUrl(status.publicUrl);
      baseUrlPrefilled.current = true;
    }
  }, [status?.publicUrl]);

  const saveMutation = useMutation({
    mutationFn: saveCredentials,
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data);
      setBotToken('');
      setWebhookSecret('');
      toast.success('Настройки сохранены');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const testMutation = useMutation({
    mutationFn: testBot,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      const name = data.bot.username
        ? `@${data.bot.username}`
        : `бот (id: ${data.bot.id})`;
      toast.success(`${name} работает`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const webhookMutation = useMutation({
    mutationFn: () => setWebhook(baseUrl.trim()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(`Webhook установлен: ${data.url}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Webhook отключён');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return {
    statusQuery,
    status,

    botToken,
    setBotToken,
    webhookSecret,
    setWebhookSecret,
    baseUrl,
    setBaseUrl,

    saveMutation,
    testMutation,
    webhookMutation,
    deleteWebhookMutation,
  };
}