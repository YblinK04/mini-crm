'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { EmailFormState, EmailSettingsData } from './types';

interface SmtpFieldsProps {
  form: EmailFormState;
  onChange: <K extends keyof EmailFormState>(
    key: K,
    value: EmailFormState[K],
  ) => void;
  onPortChange: (raw: string) => void;
  isValidPort: boolean;
  hasPassword: boolean;
  lastTest: Pick<
    EmailSettingsData,
    'smtpLastTestedAt' | 'smtpLastTestOk' | 'smtpLastTestError'
  > | null;
}

export function SmtpFields({
  form,
  onChange,
  onPortChange,
  isValidPort,
  hasPassword,
  lastTest,
}: SmtpFieldsProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-bold uppercase text-muted-foreground">
        SMTP-сервер
      </Label>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Хост</Label>
          <Input
            placeholder="smtp.yandex.ru"
            value={form.smtpHost}
            onChange={(e) => onChange('smtpHost', e.target.value)}
            className="h-9 text-sm"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Порт</Label>
          <Input
            type="number"
            placeholder="465"
            min={1}
            max={65535}
            value={form.smtpPort || ''}
            onChange={(e) => onPortChange(e.target.value)}
            className="h-9 text-sm"
            aria-invalid={!isValidPort}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.smtpSecure}
          onChange={(e) => onChange('smtpSecure', e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        Использовать SSL/TLS
      </label>
      <p className="text-[10px] text-muted-foreground -mt-2">
        Для порта 465 — включите. Для 587 (STARTTLS) — выключите.
      </p>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Логин (email)</Label>
        <Input
          placeholder="you@company.ru"
          value={form.smtpUser}
          onChange={(e) => onChange('smtpUser', e.target.value)}
          className="h-9 text-sm"
          autoComplete="off"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Пароль {hasPassword && '(сохранён — оставьте пустым)'}
        </Label>
        <Input
          type="password"
          placeholder={hasPassword ? '••••••••' : 'Пароль приложения'}
          value={form.smtpPassword}
          onChange={(e) => onChange('smtpPassword', e.target.value)}
          className="h-9 text-sm"
          autoComplete="new-password"
        />
        <p className="text-[10px] text-muted-foreground">
          Для Yandex/Mail.ru — создайте «пароль приложения» в настройках почты
        </p>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          От кого (опционально)
        </Label>
        <Input
          placeholder="RealCRM <noreply@company.ru>"
          value={form.smtpFrom}
          onChange={(e) => onChange('smtpFrom', e.target.value)}
          className="h-9 text-sm"
          autoComplete="off"
        />
      </div>

      {lastTest?.smtpLastTestedAt && (
        <div className="text-[11px] flex items-center gap-1.5">
          {lastTest.smtpLastTestOk ? (
            <>
              <CheckCircle2
                className="h-3 w-3 text-emerald-600"
                aria-hidden="true"
              />
              <span className="text-emerald-600">
                SMTP работает (проверено{' '}
                {new Date(lastTest.smtpLastTestedAt).toLocaleString('ru-RU')})
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 text-red-600" aria-hidden="true" />
              <span className="text-red-600">
                Ошибка проверки:{' '}
                {lastTest.smtpLastTestError ?? 'неизвестная ошибка'}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}