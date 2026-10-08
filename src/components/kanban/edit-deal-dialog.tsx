'use client';

import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  useEditDealForm,
  type Deal,
} from '@/store/forms/useEditDealForm';
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
import { DealTasks } from '../tasks/DealTasks';
import { Chat } from '../messages/Chat';

type TabValue = 'main' | 'tasks' | 'chat';

interface EditDealDialogProps {
  deal: Deal | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;

  defaultTab?: TabValue;
}

export function EditDealDialog({
  deal,
  open,
  onOpenChange,
  defaultTab = 'main',
}: EditDealDialogProps) {
  const { updateDeal, deleteDeal } = useDealMutations(deal?.pipelineId ?? '');

  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

  useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [open, defaultTab]);

  const onSaveHandler = useCallback(
    async (payload: {
      id: string;
      title: string;
      budget: number;
      description: string | null;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      customFields: Record<string, string>;
    }) => {
      await updateDeal.mutateAsync({
        id: payload.id,
        title: payload.title,
        budget: payload.budget,
        description: payload.description,
        priority: payload.priority,
        customFields: payload.customFields,
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

  const stopEnterPropagation = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [],
  );

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
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabValue)}
                className="w-full"
              >
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
                  <div onKeyDown={stopEnterPropagation}>
                    <DealTasks dealId={deal.id} />
                  </div>
                </TabsContent>

                <TabsContent
                  value="chat"
                  forceMount
                  className="pt-4 data-[state=inactive]:hidden"
                >
                  <div onKeyDown={stopEnterPropagation}>
                    <Chat dealId={deal.id} />
                  </div>
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
                  <Trash2 className="w-4 h-4" />
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