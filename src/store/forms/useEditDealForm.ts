// src/store/useEditDealForm.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
type PriorityType = z.infer<typeof PriorityEnum>;

const customFieldSchema = z.object({
  key: z.string().min(1, 'Название поля не может быть пустым'),
  value: z.string(),
});

export const editDealFormSchema = z.object({
  title: z.string().min(1, 'Название сделки обязательно для заполнения').max(255, 'Название сделки слишком длинное'),
  description: z.string().nullable(),
  budget: z
    .number({
      message: 'Бюджет должен быть числом',
    })
    .min(0, 'Бюджет не может быть отрицательным'),
  priority: PriorityEnum,
  stageId: z.string().min(1, 'Идентификатор стадии обязателен'),
  pipelineId: z.string().min(1, 'Идентификатор воронки обязателен'),
  companyId: z.string().nullable(),
  contactIds: z.array(z.string()),
  customFieldsArray: z.array(customFieldSchema),
});

export type EditDealFormInputs = z.infer<typeof editDealFormSchema>;

export interface DealContact {
  id: string;
  name?: string;
}

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  budget: number;
  priority: PriorityType;
  stageId: string;
  pipelineId: string;
  companyId: string | null;
  contacts?: DealContact[];
  customFields?: Record<string, unknown> | null;
}

interface UseEditDealFormOptions {
  deal: Deal | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: {
    id: string;
    title: string;
    budget: number;
    description: string | null;
    priority: PriorityType;
    customFields: Record<string, string>;
  }) => Promise<void> | void;
  // 🔥 ИНВЕРСИЯ УПРАВЛЕНИЯ: Передаем сюда вашу рабочую мутацию удаления сделки
  onDeleteDeal?: (payload: { dealId: string; stageId: string }) => void;
  isPending?: boolean;
}

export function useEditDealForm({
  deal,
  open,
  onOpenChange,
  onSave,
  onDeleteDeal,
  isPending = false,
}: UseEditDealFormOptions) {

  const mapDbFieldsToFieldsArray = (
    customFields: Record<string, unknown> | null | undefined
  ): { key: string; value: string }[] => {
    if (!customFields) return [];
    return Object.entries(customFields).map(([key, value]) => ({
      key,
      value: value !== null && value !== undefined ? String(value) : '',
    }));
  };

  const form = useForm<EditDealFormInputs>({
    resolver: zodResolver(editDealFormSchema),
    defaultValues: {
      title: deal?.title || '',
      description: deal?.description || '',
      budget: typeof deal?.budget === 'number' ? deal.budget / 100 : 0,
      priority: deal?.priority || 'MEDIUM',
      stageId: deal?.stageId || '',
      pipelineId: deal?.pipelineId || '',
      companyId: deal?.companyId || null,
      contactIds: deal?.contacts?.map((c) => c.id) || [],
      customFieldsArray: mapDbFieldsToFieldsArray(deal?.customFields),
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customFieldsArray',
  });

  useEffect(() => {
    if (open && deal?.id) {
      form.reset({
        title: deal.title || '',
        description: deal.description || '',
        budget: typeof deal.budget === 'number' ? deal.budget / 100 : 0,
        priority: deal.priority || 'MEDIUM',
        stageId: deal.stageId,
        pipelineId: deal.pipelineId,
        companyId: deal.companyId || null,
        contactIds: deal.contacts?.map((c) => c.id) || [],
        customFieldsArray: mapDbFieldsToFieldsArray(deal.customFields),
      });
    }
  }, [open, deal?.id, form]);

  const onSubmitHandler = async (data: EditDealFormInputs) => {
    if (!deal?.id) {
      toast.error('Критическая ошибка: Идентификатор сделки потерян');
      return;
    }

    try {
      const transformedCustomFields: Record<string, string> = {};
      
      data.customFieldsArray.forEach((item) => {
        const trimmedKey = item.key.trim();
        if (trimmedKey) {
          transformedCustomFields[trimmedKey] = item.value.trim();
        }
      });

      const budgetInCents = Math.round((data.budget || 0) * 100);
      const cleanTitle = data.title.trim();
      const cleanDescription = data.description?.trim() || null;
      const targetId = deal.id.startsWith('client-') ? deal.id.replace('client-', '') : deal.id;

      await onSave({
        id: targetId,
        title: cleanTitle,
        budget: budgetInCents,
        description: cleanDescription,
        priority: data.priority,
        customFields: transformedCustomFields,
      });

      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка СУБД';
      toast.error(`Ошибка обновления сделки: ${errorMessage}`);
      console.error('[CRM_EDIT_DEAL_ERROR]', error);
    }
  };

  const deleteDealHandler = useCallback(async () => {
    if (!deal?.id || !deal?.stageId) {
      toast.error('Ошибка: Недостаточно данных для удаления сделки');
      return;
    }

    const confirmDelete = window.confirm('Вы уверены, что хотите безвозвратно удалить эту сделку?');
    if (!confirmDelete) return;

    if (typeof onDeleteDeal !== 'function') {
      toast.error('Критическая архитектурная ошибка: обработчик onDeleteDeal не передан в форму');
      return;
    }

    onOpenChange(false);

    const targetServerId = deal.id.startsWith('client-') 
      ? deal.id.replace('client-', '') 
      : deal.id;

    onDeleteDeal({
      dealId: targetServerId,
      stageId: deal.stageId,
    });
  }, [deal, onOpenChange, onDeleteDeal]);

  return {
    form,
    fields,
    appendCustomField: () => append({ key: '', value: '' }),
    removeCustomField: (index: number) => remove(index),
    isSubmitting: form.formState.isSubmitting || isPending,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(onSubmitHandler),
    deleteDeal: deleteDealHandler,
  };
}

