'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EmailFormState } from './types';

interface NotificationFieldsProps {
  form: EmailFormState;
  onChange: <K extends keyof EmailFormState>(
    key: K,
    value: EmailFormState[K],
  ) => void;
}

export function NotificationFields({
  form,
  onChange,
}: NotificationFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Получатель уведомлений
        </Label>
        <Input
          type="email"
          placeholder="owner@company.ru"
          value={form.ownerEmail}
          onChange={(e) => onChange('ownerEmail', e.target.value)}
          className="h-9 text-sm"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground">
          Что присылать
        </Label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.notifyOnNewLead}
            onChange={(e) => onChange('notifyOnNewLead', e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          Новая заявка во «Входящих»
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.notifyDailyDigest}
            onChange={(e) => onChange('notifyDailyDigest', e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          Утренний дайджест (задачи + заявки)
        </label>
      </div>
    </>
  );
}