'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchEmailSettings,
  saveEmailSettings,
  testSmtp,
  sendTestEmail,
} from './api';
import { KNOWN_PORT_SECURE, QUERY_KEY } from './constants';
import {
  INITIAL_FORM_STATE,
  type EmailFormState,
  type EmailSettingsData,
} from './types';

export function useEmailSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<EmailFormState>(INITIAL_FORM_STATE);
  const [hasPassword, setHasPassword] = useState(false);

  const query = useQuery<EmailSettingsData>({
    queryKey: QUERY_KEY,
    queryFn: fetchEmailSettings,
  });

  useEffect(() => {
    if (!query.data) return;
    const d = query.data;
    setForm({
      smtpHost: d.smtpHost ?? '',
      smtpPort: d.smtpPort ?? 465,
      smtpSecure: d.smtpSecure ?? true,
      smtpUser: d.smtpUser ?? '',
      smtpPassword: '',
      smtpFrom: d.smtpFrom ?? '',
      ownerEmail: d.ownerEmail ?? '',
      emailNotificationsEnabled: d.emailNotificationsEnabled,
      notifyOnNewLead: d.notifyOnNewLead,
      notifyDailyDigest: d.notifyDailyDigest,
    });
    setHasPassword(d.hasSmtpPassword);
  }, [query.data]);

  const isDirty = useMemo(() => {
    if (!query.data) return false;
    const d = query.data;
    return (
      form.smtpHost !== (d.smtpHost ?? '') ||
      form.smtpPort !== (d.smtpPort ?? 465) ||
      form.smtpSecure !== (d.smtpSecure ?? true) ||
      form.smtpUser !== (d.smtpUser ?? '') ||
      form.smtpPassword !== '' ||
      form.smtpFrom !== (d.smtpFrom ?? '') ||
      form.ownerEmail !== (d.ownerEmail ?? '') ||
      form.emailNotificationsEnabled !== d.emailNotificationsEnabled ||
      form.notifyOnNewLead !== d.notifyOnNewLead ||
      form.notifyDailyDigest !== d.notifyDailyDigest
    );
  }, [form, query.data]);

  const isValidPort = form.smtpPort >= 1 && form.smtpPort <= 65535;

  const updateField = <K extends keyof EmailFormState>(
    key: K,
    value: EmailFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePortChange = (raw: string) => {
    const port = raw === '' ? 0 : Number(raw);
    setForm((prev) => {
      const next = { ...prev, smtpPort: port };
      if (port in KNOWN_PORT_SECURE) {
        next.smtpSecure = KNOWN_PORT_SECURE[port];
      }
      return next;
    });
  };

  const save = useMutation({
    mutationFn: () => saveEmailSettings(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Настройки сохранены');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const test = useMutation({
    mutationFn: testSmtp,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Подключение работает!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendTest = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: () => toast.success('Тестовое письмо отправлено'),
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    
    data: query.data,
    isLoading: query.isLoading,
    hasPassword,

    form,
    updateField,
    handlePortChange,
    isValidPort,

    isDirty,

    save,
    test,
    sendTest,
  };
}