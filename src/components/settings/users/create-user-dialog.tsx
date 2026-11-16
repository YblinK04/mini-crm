'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
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

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generatePassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  for (const b of bytes) result += alphabet[b % alphabet.length];
  return result + '1';
}

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => generatePassword());

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role: 'MANAGER',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          (err as { error?: string }).error ||
          'Не удалось создать пользователя';
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Менеджер создан', {
        description: `Пароль: ${password} — передайте сотруднику лично`,
        duration: 15000,
      });
      setName('');
      setEmail('');
      setPassword(generatePassword());
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить менеджера</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="user-name">Имя</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Петров"
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="user-email">Email (логин)</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ivan@company.ru"
              autoComplete="off"
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="user-password">Пароль</Label>
            <div className="flex gap-2">
              <Input
                id="user-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={mutation.isPending}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPassword(generatePassword())}
                disabled={mutation.isPending}
                aria-label="Сгенерировать новый пароль"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Передайте пароль сотруднику лично. При первом входе он сможет
              сменить его в профиле.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Отмена
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              !name.trim() ||
              !email.trim() ||
              password.length < 8
            }
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}