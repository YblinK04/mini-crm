'use client';

import React from 'react';
import { useEditDealForm, Deal } from '@/store/forms/useEditDealForm';
import { useDealMutations } from '@/store/mutations/useDealMutations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

import { CRMTextField } from './crm-text-field';
import { CRMPrioritySelect } from './crm-priority-select';
import { CustomFieldsSection } from './custom-field-section';

interface EditDealDialogProps {
  deal: Deal | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDealDialog({ deal, open, onOpenChange }: EditDealDialogProps) {
  const { updateDeal, deleteDeal } = useDealMutations(deal?.pipelineId || '');

  const onSaveHandler = async (payload: {
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
  };

  const { form, isSubmitting, handleSubmit, deleteDeal: deleteDealHandler } = useEditDealForm({
    deal,
    open,
    onOpenChange,
    onSave: onSaveHandler,
    onDeleteDeal: deleteDeal.mutate,
    isPending: updateDeal?.isPending || deleteDeal?.isPending,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto border-none shadow-2xl bg-background text-foreground rounded-2xl scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Карточка сделки</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            
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

            <DialogFooter className="pt-4 flex flex-row items-center justify-between border-t border-muted/20 w-full gap-2">
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
                  Отмена
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
      </DialogContent>
    </Dialog>
  );
}
