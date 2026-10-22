'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContactOption } from './types';

export const NO_CONTACT = '__none__';

interface ContactSelectorProps {
  contacts: ContactOption[];
  isLoading: boolean;
  isError: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ContactSelector({
  contacts,
  isLoading,
  isError,
  value,
  onChange,
  disabled,
}: ContactSelectorProps) {
  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground">Загрузка контактов...</p>
    );
  }

  if (isError) {
    return (
      <p className="text-xs text-destructive">
        Не удалось загрузить контакты
      </p>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id="deal-contact"
        className="bg-muted/30 border-none focus:ring-1 focus:ring-primary rounded-xl h-10 text-sm"
      >
        <SelectValue placeholder="Выберите клиента..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_CONTACT}>
          <span className="text-muted-foreground">— Не выбран —</span>
        </SelectItem>
        {contacts.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Нет доступных контактов
          </div>
        ) : (
          contacts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.firstName}
              {c.lastName ? ` ${c.lastName}` : ''}
              {c.telegramUsername && !c.telegramUsername.startsWith('web:')
                ? ` (@${c.telegramUsername})`
                : ''}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}