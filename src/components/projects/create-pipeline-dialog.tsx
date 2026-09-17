'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { CreatePipelineSchema } from '@/lib/schemas';
import { createPipelineAction } from '@/app/(dashboard)/pipelines/actions'; // Интеграция нашего серверного экшена воронок

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreatePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePipelineDialog({ open, onOpenChange }: CreatePipelineDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.input<typeof CreatePipelineSchema>>({
    resolver: zodResolver(CreatePipelineSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const onSubmit = (values: z.input<typeof CreatePipelineSchema>) => {
    startTransition(async () => {
      const result = await createPipelineAction(values);

      if (result.success) {
        toast.success('Воронка продаж успешно создана');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Не удалось создать воронку продаж');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Новая воронка продаж</DialogTitle>
          <DialogDescription>
            Создайте новый торговый конвейер. Базовые CRM-этапы развернутся автоматически.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
                    Название воронки
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Например: Оптовые продажи, Услуги СТО" 
                      disabled={isPending} 
                      className="bg-muted/30 border-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)} 
                disabled={isPending}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isPending} className="min-w-[120px]">
                {isPending ? 'Создание...' : 'Создать воронку'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
