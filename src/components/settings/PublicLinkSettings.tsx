'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Link2, Check, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

export function PublicLinkSettings() {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['org-public-link'],
    queryFn: async () => {
      const res = await fetch('/api/settings/public-link');
      if (!res.ok) throw new Error('Ошибка загрузки');
      return res.json() as Promise<{ slug: string | null; suggestedSlug: string | null }>;
    },
  });

  useEffect(() => {
    if (data) {
      setInputValue(data.slug || data.suggestedSlug || '');
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSlug: string) => {
      const res = await fetch('/api/settings/public-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка сохранения');
      }
      return res.json();
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['org-public-link'] });
      toast.success('Адрес формы сохранен!');
      setInputValue(resData.slug);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/public-link', { method: 'POST' });
      if (!res.ok) throw new Error('Ошибка генерации');
      return res.json();
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['org-public-link'] });
      toast.success('Адрес сгенерирован!');
      setInputValue(resData.slug);
    },
    onError: () => toast.error('Не удалось сгенерировать'),
  });

  if (isLoading) return <div className="text-xs text-muted-foreground">Загрузка...</div>;

  const isChanged = inputValue !== data?.slug;

  return (
    <Card className="border-none shadow-md bg-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Публичная форма заявок
        </CardTitle>
        <CardDescription className="text-xs">
          Ссылка на форму, где клиенты могут оставить заявку. Она сразу попадет в канбан.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="public-slug" className="text-xs font-medium text-muted-foreground">
            Адрес ссылки
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              /lead/
            </span>
            <Input
              id="public-slug"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-company"
              className="flex-1 font-mono text-sm"
              disabled={saveMutation.isPending || generateMutation.isPending}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Только латиница, цифры и дефисы. Максимум 32 символа.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => saveMutation.mutate(inputValue)}
            disabled={!inputValue || !isChanged || saveMutation.isPending || generateMutation.isPending}
            className="h-9 rounded-xl text-xs font-semibold"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Сохранить
          </Button>

          <Button
            variant="outline"
            onClick={() => generateMutation.mutate()}
            disabled={saveMutation.isPending || generateMutation.isPending}
            className="h-9 rounded-xl text-xs font-semibold"
          >
            {generateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Сгенерировать по названию
          </Button>
        </div>
        
        {inputValue && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Предпросмотр:</p>
            <code className="bg-muted px-2 py-1.5 rounded text-[11px] text-primary break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/lead/{inputValue}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}