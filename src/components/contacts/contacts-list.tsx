'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Search, MessageSquare, Phone, User, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EditContactDialog } from './edit-contact-dialog';

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  telegramUsername: string | null;
  _count: { deals: number };
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

function isWebChatUsername(username: string): boolean {
  return username.startsWith('web:') || username.startsWith('web_');
}

export function ContactsList({
  initialContacts,
}: {
  initialContacts: Contact[];
}) {
  const [search, setSearch] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    if (!term) return initialContacts;

    const phoneTerm = normalizePhone(term);

    return initialContacts.filter((c) => {
      if (c.firstName.toLowerCase().includes(term)) return true;
      if (c.lastName && c.lastName.toLowerCase().includes(term)) return true;
      if (c.email && c.email.toLowerCase().includes(term)) return true;
      if (
        c.telegramUsername &&
        !isWebChatUsername(c.telegramUsername) &&
        c.telegramUsername.toLowerCase().includes(term)
      ) {
        return true;
      }
      if (phoneTerm && c.phone && normalizePhone(c.phone).includes(phoneTerm)) {
        return true;
      }
      return false;
    });
  }, [initialContacts, deferredSearch]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Поиск по имени, телефону, email или Telegram..."
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
          Ничего не найдено по запросу «{search.trim()}».
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contact) => {
            const telegramVisible =
              contact.telegramUsername &&
              !isWebChatUsername(contact.telegramUsername);

            return (
              <div
                key={contact.id}
                className="group relative flex flex-col gap-3 rounded-xl border border-muted-foreground/10 bg-card p-4 transition-colors hover:bg-muted/20 cursor-pointer"
                onClick={() => setEditingContact(contact)}
              >
                <div className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Pencil
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>

                <div className="flex items-start justify-between pr-6">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {contact.firstName}
                        {contact.lastName ? ` ${contact.lastName}` : ''}
                      </div>
                    </div>
                  </div>
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
                  {telegramVisible && (
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
                  {!contact.phone && !telegramVisible && (
                    <div className="text-muted-foreground/50 italic">
                      Нет контактных данных
                    </div>
                  )}
                </div>

                <Badge variant="secondary" className="text-[10px] self-start">
                  Сделок: {contact._count?.deals ?? 0}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      <EditContactDialog
        contact={editingContact}
        open={Boolean(editingContact)}
        onOpenChange={(open) => {
          if (!open) setEditingContact(null);
        }}
      />
    </div>
  );
}