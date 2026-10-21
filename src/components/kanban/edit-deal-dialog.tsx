
'use client';

import React, { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWatch } from 'react-hook-form';
import { useEditDealForm, type Deal } from '@/store/forms/useEditDealForm';
import { useDealMutations } from '@/store/mutations/useDealMutations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { CRMTextField } from './crm-text-field';
import { CRMPrioritySelect } from './crm-priority-select';
import { CustomFieldsSection } from './custom-field-section';
import { DealTasks } from '../tasks/DealTasks';
import { Chat } from '../messages/Chat';


interface ContactOption {
  id: string;
  firstName: string;
  lastName: string | null;
  telegramUsername: string | null;
}

interface DealSavePayload {
  id: string;
  title: string;
  budget: number;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customFields: Record<string, string>;
  contactIds?: string[];
}

interface EditDealDialogProps {
  deal: Deal | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NO_CONTACT = '__none__';


export function EditDealDialog({
  deal,
  open,
  onOpenChange,
}: EditDealDialogProps) {
  const { updateDeal, deleteDeal } = useDealMutations(deal?.pipelineId ?? '');


  const {
    data: contacts = [],
    isLoading: contactsLoading,
    isError: contactsError,
  } = useQuery<ContactOption[]>({
    queryKey: ['contacts', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to load contacts');
      return res.json();
    },
    enabled: open,
  });


  const onSaveHandler = useCallback(
    async (payload: DealSavePayload) => {
      await updateDeal.mutateAsync({
        id: payload.id,
        title: payload.title,
        budget: payload.budget,
        description: payload.description,
        priority: payload.priority,
        customFields: payload.customFields,
        contactIds: payload.contactIds,
      });
    },
    [updateDeal],
  );

  const {
    form,
    isSubmitting,
    handleSubmit,
    deleteDeal: deleteDealHandler,
  } = useEditDealForm({
    deal,
    open,
    onOpenChange,
    onSave: onSaveHandler,
    onDeleteDeal: deleteDeal.mutate,
    isPending: updateDeal.isPending || deleteDeal.isPending,
  });

  const selectedContactIds =
    useWatch({
      control: form.control,
      name: 'contactIds',
    }) ?? [];

  const selectedContactId = selectedContactIds[0] ?? NO_CONTACT;

  const handleContactChange = (value: string) => {
    const nextIds = value === NO_CONTACT ? [] : [value];
    form.setValue('contactIds', nextIds, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };


  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const handleCopyLink = async () => {
    if (!deal || isGeneratingLink) return;

    setIsGeneratingLink(true);
    setFallbackUrl(null);

    try {
      const res = await fetch(`/api/deals/${deal.id}/token`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('request_failed');

      const { token } = (await res.json()) as { token: string };
      const url = `${window.location.origin}/chat/${token}`;

      try {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка на чат скопирована');
      } catch {
        setFallbackUrl(url);
      }
    } catch {
      toast.error('Не удалось сгенерировать ссылку');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto border-none shadow-2xl bg-background text-foreground rounded-2xl scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Карточка сделки
          </DialogTitle>
        </DialogHeader>

        {open && deal ? (
          <Form {...form}>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="main" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="main">Основное</TabsTrigger>
                  <TabsTrigger value="tasks">Задачи</TabsTrigger>
                  <TabsTrigger value="chat">Чат</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="main"
                  forceMount
                  className="space-y-4 pt-4 data-[state=inactive]:hidden"
                >
                  <CRMTextField
                    control={form.control}
                    name="title"
                    label="Название сделки / Клиент"
                    placeholder="Название сделки"
                    disabled={isSubmitting}
                  />

                  <div className="space-y-2">
                    <label
                      htmlFor="deal-contact"
                      className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1"
                    >
                      Клиент (Контакт)
                    </label>

                    {contactsLoading ? (
                      <p className="text-xs text-muted-foreground">
                        Загрузка контактов...
                      </p>
                    ) : contactsError ? (
                      <p className="text-xs text-destructive">
                        Не удалось загрузить контакты
                      </p>
                    ) : (
                      <Select
                        value={selectedContactId}
                        onValueChange={handleContactChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger
                          id="deal-contact"
                          className="bg-muted/30 border-none focus:ring-1 focus:ring-primary rounded-xl h-10 text-sm"
                        >
                          <SelectValue placeholder="Выберите клиента..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CONTACT}>
                            <span className="text-muted-foreground">
                              — Не выбран —
                            </span>
                          </SelectItem>
                          {contacts.length === 0 ? (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                              Нет доступных контактов
                            </div>
                          ) : (
                            contacts.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.firstName}
                                {c.lastName ? ` ${c.lastName}` : ''}
                                {c.telegramUsername
                                  ? ` (@${c.telegramUsername})`
                                  : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <CRMTextField
                    control={form.control}
                    name="budget"
                    label="Бюджет сделки (₽)"
                    type="number"
                    disabled={isSubmitting}
                    isBudget
                  />

                  <CRMTextField
                    control={form.control}
                    name="description"
                    label="Описание сделки"
                    placeholder="Примечания к сделке..."
                    disabled={isSubmitting}
                    isTextArea
                  />

                  <CRMPrioritySelect
                    control={form.control}
                    disabled={isSubmitting}
                  />

                  <CustomFieldsSection
                    control={form.control}
                    disabled={isSubmitting}
                  />
                </TabsContent>

                <TabsContent
                  value="tasks"
                  forceMount
                  className="pt-4 data-[state=inactive]:hidden"
                >
                  <DealTasks dealId={deal.id} />
                </TabsContent>

                <TabsContent
                  value="chat"
                  forceMount
                  className="pt-4 data-[state=inactive]:hidden"
                >
                  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground max-w-[240px]">
                        Отправьте клиенту персональную ссылку. Любой,
                        у кого она есть, может писать в чат.
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleCopyLink}
                        disabled={isGeneratingLink}
                        className="h-8 gap-1.5 rounded-lg text-xs font-semibold shrink-0"
                      >
                        {isGeneratingLink ? (
                          <Loader2
                            className="w-3.5 h-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Link2
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                        )}
                        {isGeneratingLink
                          ? 'Генерация...'
                          : 'Скопировать ссылку'}
                      </Button>
                    </div>

                    {fallbackUrl && (
                      <div className="space-y-1.5 pt-2 border-t border-amber-500/20">
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Не удалось скопировать автоматически.
                          Скопируйте вручную:
                        </p>
                        <Input
                          readOnly
                          value={fallbackUrl}
                          onFocus={(e) => e.currentTarget.select()}
                          className="font-mono text-xs h-8"
                          aria-label="Ссылка на чат"
                        />
                      </div>
                    )}
                  </div>

                  <Chat dealId={deal.id} />
                </TabsContent>
              </Tabs>

              <DialogFooter className="pt-4 mt-4 flex flex-row items-center justify-between border-t border-muted/20 w-full gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={deleteDealHandler}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1.5 h-10 px-3"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Удалить сделку</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                    className="rounded-xl text-xs font-semibold h-10"
                  >
                    Закрыть
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[140px] rounded-xl text-xs font-semibold h-10"
                  >
                    Сохранить изменения
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}