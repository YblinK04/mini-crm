'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const NAME_MAX = 100;
const MESSAGE_MAX = 4000;

export function LeadForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const canSubmit = Boolean(name.trim()) && Boolean(message.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/public/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After');
          const seconds = retryAfter ? Number(retryAfter) : 60;
          throw new Error(
            `Слишком много заявок. Подождите ${seconds} сек.`,
          );
        }
        if (res.status === 422) {
          const fieldErrors = data?.details?.fieldErrors;
          const firstError =
            fieldErrors?.name?.[0] ??
            fieldErrors?.message?.[0] ??
            'Проверьте поля формы';
          throw new Error(firstError);
        }

        if (res.status === 404) {
          throw new Error(
            'Форма недоступна. Обратитесь к администратору.',
          );
        }
        throw new Error(
          data?.error ?? 'Ошибка сервера. Попробуйте позже.',
        );
      }
      const token = data?.token;
      if (typeof token !== 'string' || token.length === 0) {
        throw new Error(
          'Сервер не вернул ссылку на чат. Попробуйте позже.',
        );
      }
      router.push(`/chat/${encodeURIComponent(token)}`);
    } catch (error: unknown) {
      setIsLoading(false);
      const messageText =
        error instanceof Error
          ? error.message
          : 'Не удалось отправить заявку. Попробуйте ещё раз.';
      toast.error(messageText);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-busy={isLoading}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="name">Ваше имя</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Иван"
          disabled={isLoading}
          maxLength={NAME_MAX}
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Сообщение</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Хочу заказать сайт..."
          className="min-h-[100px] resize-none"
          disabled={isLoading}
          maxLength={MESSAGE_MAX}
          required
        />
        <p className="text-[10px] text-muted-foreground text-right tabular-nums">
          {message.length} / {MESSAGE_MAX}
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !canSubmit}
      >
        {isLoading && (
          <Loader2
            className="h-4 w-4 animate-spin mr-2"
            aria-hidden="true"
          />
        )}
        {isLoading ? 'Отправляем...' : 'Отправить заявку'}
      </Button>
    </form>
  );
}