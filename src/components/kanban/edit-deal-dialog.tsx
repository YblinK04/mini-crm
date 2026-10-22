// src/components/deals/EditDealDialog.tsx

'use client';

import { useCallback } from 'react';
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
import { Trash2 } from 'lucide-react';

import { CRMTextField } from './crm-text-field';
import { CRMPrioritySelect } from './crm-priority-select';
import { CustomFieldsSection } from './custom-field-section';
import { ContactSelector, NO_CONTACT } from '../deals/ContactSelector';
import { WebChatPanel } from '../deals/WebChatPanel';
import { useWebChatStatus } from '../deals/useWebChatStatus';
import type { ContactOption, DealSavePayload } from '../deals/types';
import { DealTasks } from '../tasks/DealTasks';
import { Chat } from '../messages/Chat';

interface EditDealDialogProps {
  deal: Deal | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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


  const webChat = useWebChatStatus(deal?.id, open);

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
                    <ContactSelector
                      contacts={contacts}
                      isLoading={contactsLoading}
                      isError={contactsError}
                      value={selectedContactId}
                      onChange={handleContactChange}
                      disabled={isSubmitting}
                    />
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
                  <WebChatPanel
                    dealId={deal.id}
                    status={webChat.data}
                    isLoading={webChat.isLoading}
                    onInvalidate={webChat.invalidate}
                  />

                  <Chat
                    dealId={deal.id}
                    webToken={webChat.data?.token ?? null}
                    hasTelegramContact={
                      webChat.data?.hasTelegramContact ?? false
                    }
                  />
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