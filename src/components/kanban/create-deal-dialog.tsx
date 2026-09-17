'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateDealSchema } from '@/lib/schemas';
import { useDealMutations } from '@/store/mutations/useDealMutations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

type FormInput = z.input<typeof CreateDealSchema>;
type FormOutput = z.output<typeof CreateDealSchema>;

function ThemeLabel({ text }: { text: string }) {
  return (
    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1.5 select-none">
      {text}
    </FormLabel>
  );
}

interface CreateDealDialogProps {
  stageId: string;
  pipelineId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDealDialog({
  stageId,
  pipelineId,
  open,
  onOpenChange,
}: CreateDealDialogProps) {
  const { createDeal } = useDealMutations(pipelineId);
  const isPending = createDeal.isPending;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(CreateDealSchema),
    defaultValues: {
      title: '',
      description: '',
      budget: 0,
      priority: 'MEDIUM',
      pipelineId,
      stageId,
      companyId: null,
      contactIds: [],
      customFields: [],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  const onSubmitHandler = form.handleSubmit((values) => {
    createDeal.mutate(values, {
      onSuccess: () => {
        form.reset({
          title: '',
          description: '',
          budget: 0,
          priority: 'MEDIUM',
          pipelineId,
          stageId,
          companyId: null,
          contactIds: [],
          customFields: [],
        });
        onOpenChange(false);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto border-none shadow-2xl bg-background text-foreground rounded-2xl scrollbar-thin scrollbar-thumb-muted-foreground/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Новая сделка
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmitHandler} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <ThemeLabel text="Название сделки / Клиент" />
                  <FormControl>
                    <Input
                      placeholder="Напр. Опт автозапчастей или ИП Иванов"
                      {...field}
                      disabled={isPending}
                      className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <ThemeLabel text="Первоначальный бюджет (₽)" />
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0"
                      disabled={isPending}
                      className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 text-sm font-semibold tracking-tight"
                      value={field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? 0 : Number(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <ThemeLabel text="Выбрать приоритет сделки" />
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-muted/30 border-none focus:ring-1 focus:ring-primary text-xs font-semibold rounded-xl h-10">
                        <SelectValue placeholder="Выберите приоритет" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-none shadow-xl bg-background rounded-xl">
                      <SelectItem
                        value="LOW"
                        className="cursor-pointer text-xs font-medium focus:bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 py-0.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                          <span>🟢 Низкий приоритет</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="MEDIUM"
                        className="cursor-pointer text-xs font-medium focus:bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 py-0.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          <span>🟡 Средний приоритет</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="HIGH"
                        className="cursor-pointer text-xs font-medium focus:bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 py-0.5">
                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                          <span>🟠 Высокий приоритет</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="URGENT"
                        className="cursor-pointer text-xs font-medium focus:bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 py-0.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                          <span>🔴 Критический статус</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <ThemeLabel text="Краткое примечание" />
                  <FormControl>
                    <Textarea
                      placeholder="Укажите детали запроса..."
                      {...field}
                      value={field.value ?? ''}
                      className="resize-none h-20 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-sm p-3 leading-relaxed"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  Кастомные CRM поля ({fields.length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: '', value: '' })}
                  disabled={isPending}
                  className="h-7 text-[10px] font-bold gap-1 rounded-lg border-primary/20 text-primary hover:bg-primary/5 px-2.5 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>Добавить поле</span>
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-[11px] text-muted-foreground/50 italic text-center py-2 bg-muted/10 rounded-xl border border-dashed select-none">
                  Нет кастомных полей. Нажмите кнопку выше для добавления.
                </div>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                  {fields.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <FormField
                        control={form.control}
                        name={`customFields.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="flex-1 space-y-0">
                            <FormControl>
                              <Input
                                placeholder="Напр. Телефон, Город"
                                {...field}
                                disabled={isPending}
                                className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-9 text-xs font-medium"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`customFields.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1 space-y-0">
                            <FormControl>
                              <Input
                                placeholder="Значение поля"
                                {...field}
                                disabled={isPending}
                                className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-9 text-xs"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={isPending}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl shrink-0 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0 border-t border-muted/20">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="rounded-xl text-xs font-semibold"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="min-w-[120px] rounded-xl text-xs font-semibold"
              >
                {isPending ? 'Создание...' : 'Добавить лид'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}