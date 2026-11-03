'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
}

interface EditContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactDialog({
  contact,
  open,
  onOpenChange,
}: EditContactDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (contact && open) {
      setForm({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        phone: contact.phone || '',
        email: contact.email || '',
      });
    }
  }, [contact, open]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!contact) {
        throw new Error('Контакт не выбран');
      }

      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const fieldErrors = err?.details?.fieldErrors as
          | Record<string, string[]>
          | undefined;
        const firstError = fieldErrors
          ? Object.values(fieldErrors).flat()[0]
          : undefined;
        throw new Error(firstError || err?.error || 'Ошибка сохранения');
      }

      return res.json() as Promise<Contact>;
    },

    onSuccess: (serverContact) => {
      queryClient.setQueryData(['contact', serverContact.id], serverContact);

      queryClient.invalidateQueries({ queryKey: ['inbox'] });

      queryClient.invalidateQueries({ queryKey: ['contacts'] });

      router.refresh();

      toast.success('Контакт обновлён');
      onOpenChange(false);
    },

    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Не удалось сохранить контакт';
      toast.error(message);
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (updateMutation.isPending) return;
    onOpenChange(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!contact || updateMutation.isPending) return;
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] border-none shadow-2xl bg-background rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Редактировать контакт
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 pt-2"
          aria-busy={updateMutation.isPending}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="contact-firstName" className="text-xs">
              Имя
            </Label>
            <Input
              id="contact-firstName"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="Иван"
              className="h-10 rounded-xl"
              maxLength={50}
              autoComplete="given-name"
              autoFocus
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-lastName" className="text-xs">
              Фамилия
            </Label>
            <Input
              id="contact-lastName"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Иванов"
              className="h-10 rounded-xl"
              maxLength={50}
              autoComplete="family-name"
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-phone" className="text-xs">
              Телефон
            </Label>
            <Input
              id="contact-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+7 999 123-45-67"
              className="h-10 rounded-xl"
              maxLength={50}
              autoComplete="tel"
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-email" className="text-xs">
              Email
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ivan@example.com"
              className="h-10 rounded-xl"
              maxLength={255}
              autoComplete="email"
              disabled={updateMutation.isPending}
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="rounded-xl text-xs"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !form.firstName.trim()}
              className="rounded-xl text-xs font-semibold"
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}