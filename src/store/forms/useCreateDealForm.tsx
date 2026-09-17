// src/store/useCreateDealForm.ts
'use client';
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDealSchema, type CreateDealInput, type CreateDealOutput } from '@/lib/schemas';

interface UseCreateDealFormOptions {
  stageId: string;
  pipelineId: string;
  onOpenChange: (open: boolean) => void;
  onCreateDeal: (
    payload: CreateDealOutput,
    options?: { onSuccess?: () => void }
  ) => void;
  isPending: boolean;
}

export function useCreateDealForm({
  stageId,
  pipelineId,
  onOpenChange,
  onCreateDeal,
  isPending,
}: UseCreateDealFormOptions) {
  
type FormInput  = z.input<typeof CreateDealSchema>;   
type FormOutput = z.output<typeof CreateDealSchema>; 

const form = useForm<FormInput, any, FormOutput>({
  resolver: zodResolver(CreateDealSchema),
  defaultValues: {
    title: '',
    description: '',
    budget: 0,             
    priority: 'MEDIUM',
    pipelineId: '',
    stageId: '',
    companyId: null,
    contactIds: [],
    customFields: [],      
  },
});
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customFields', 
  });

  const submitForm = form.handleSubmit((values) => {
    onCreateDeal(values as unknown as CreateDealOutput, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  });

  return {
    form,
    fields,
    appendCustomField: () => append({ key: '', value: '' }),
    removeCustomField: (index: number) => remove(index),
    isPending,
    submitForm,
  };
}
