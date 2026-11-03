'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface WelcomeNameFormProps {
  token: string;
  onSuccess: () => void;
}

export function WelcomeNameForm({ token, onSuccess }: WelcomeNameFormProps) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    consent: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    
    if (!trimmedName || !form.consent) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/public/chat/${encodeURIComponent(token)}/name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          consent: form.consent,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        
        const fieldErrors = data?.details?.fieldErrors as Record<string, string[]> | undefined;
        const firstError = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;

        throw new Error(firstError || data.error || 'Не удалось сохранить профиль');
      }

      toast.success('Приятно познакомиться!');
      onSuccess(); 
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сервера');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-sm space-y-6 bg-background p-6 rounded-2xl shadow-lg border border-muted-foreground/10">
        
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Давайте познакомимся</h2>
          <p className="text-sm text-muted-foreground">
            Заполните профиль, чтобы менеджер мог связаться с вами.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Ваше имя <span className="text-destructive">*</span></Label>
            <Input
              id="client-name"
              placeholder="Например, Александр"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isLoading}
              maxLength={50}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-phone">Телефон</Label>
            <Input
              id="client-phone"
              type="tel"
              placeholder="+7 999 123-45-67"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              placeholder="ivan@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="client-consent"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              disabled={isLoading}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary"
              required
            />
            <Label htmlFor="client-consent" className="text-xs font-normal text-muted-foreground leading-snug cursor-pointer select-none">
              Я согласен на обработку персональных данных
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl mt-2"
            disabled={isLoading || !form.name.trim() || !form.consent}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? 'Сохранение...' : 'Начать чат'}
          </Button>
        </form>
      </div>
    </div>
  );
}