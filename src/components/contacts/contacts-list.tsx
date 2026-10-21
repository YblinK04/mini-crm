'use client';

import { useMemo, useState } from 'react';
import { Search, MessageSquare, Phone, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  telegramUsername: string | null;
  createdAt: Date | string;
  _count: { deals: number };
}

interface ContactsListProps {
  initialContacts: Contact[];
}

const LOCALE = 'ru-RU';

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

function formatCreatedAt(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(LOCALE);
}

export function ContactsList({ initialContacts }: ContactsListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return initialContacts;

    const phoneTerm = normalizePhone(term);

    return initialContacts.filter((c) => {
      if (c.firstName.toLowerCase().includes(term)) return true;
      if (c.lastName && c.lastName.toLowerCase().includes(term)) return true;
      if (c.email && c.email.toLowerCase().includes(term)) return true;
      if (
        c.telegramUsername &&
        c.telegramUsername.toLowerCase().includes(term)
      ) {
        return true;
      }
      if (phoneTerm && c.phone && normalizePhone(c.phone).includes(phoneTerm)) {
        return true;
      }
      return false;
    });
  }, [initialContacts, search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Поиск по имени, телефону или Telegram..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background h-10"
        />
      </div>

      {initialContacts.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Пока нет клиентов. Добавьте первого.
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Ничего не найдено по запросу «{search}».
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              className="flex flex-col gap-3 rounded-xl border border-muted-foreground/10 bg-card p-4 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {contact.firstName}
                      {contact.lastName ? ` ${contact.lastName}` : ''}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      В базе с {formatCreatedAt(contact.createdAt)}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Сделок: {contact._count?.deals ?? 0}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone
                      className="h-3.5 w-3.5 opacity-60 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{contact.phone}</span>
                  </div>
                )}
                {contact.telegramUsername && (
                  <div className="flex items-center gap-2">
                    <MessageSquare
                      className="h-3.5 w-3.5 opacity-60 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      @{contact.telegramUsername}
                    </span>
                  </div>
                )}
                {!contact.phone && !contact.telegramUsername && (
                  <div className="text-muted-foreground/50 italic">
                    Нет контактных данных
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}