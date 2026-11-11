'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LeadFormProps {
  slug: string;
}

export function LeadForm({ slug }: LeadFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !message.trim()) {
      toast.error('Заполните имя и сообщение');
      return;
    }

    if (!consent) {
      toast.error('Необходимо согласие на обработку данных');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/public/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          message: message.trim(),
          consent: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[LEAD_FORM_ERROR]', err);
        throw new Error(
          (err as { error?: string }).error || 'Ошибка сервера',
        );
      }

      const data = await res.json();
      router.push(`/chat/${data.token}`);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Не удалось отправить заявку';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Ваше имя *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Иван"
          autoComplete="name"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Телефон</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 999 123-45-67"
          autoComplete="tel"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ivan@example.com"
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Сообщение *</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Хочу заказать сайт..."
          className="min-h-[100px] resize-none"
          disabled={isLoading}
          required
        />
      </div>

      <div className="flex items-start gap-2 pt-2">
        <input
          type="checkbox"
          id="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={isLoading}
          className="mt-1 h-4 w-4 rounded border-input accent-primary cursor-pointer"
        />
        <div className="text-[11px] text-muted-foreground leading-tight">
          <label htmlFor="consent" className="cursor-pointer">
            Я согласен на обработку персональных данных в соответствии с
          </label>{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Политикой конфиденциальности
          </a>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !name.trim() || !message.trim() || !consent}
      >
        {isLoading ? (
          <>
            <Loader2
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
            Отправка...
          </>
        ) : (
          'Отправить заявку'
        )}
      </Button>
    </form>
  );
}