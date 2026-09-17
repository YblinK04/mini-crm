'use client';

import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditDealFormInputs } from '@/store/forms/useEditDealForm';
import { cn } from '@/lib/utils';

export const PRIORITIES = [
  { value: 'LOW', label: '🟢 Низкий приоритет', color: 'bg-slate-400 dark:bg-slate-500' },
  { value: 'MEDIUM', label: '🟡 Средний приоритет', color: 'bg-amber-500' },
  { value: 'HIGH', label: '🟠 Высокий приоритет', color: 'bg-orange-500' },
  { value: 'URGENT', label: '🔴 Критический статус', color: 'bg-red-500 animate-pulse' },
] as const;

interface CRMPrioritySelectProps {
  control: Control<EditDealFormInputs>;
  disabled?: boolean;
}

export function CRMPrioritySelect({ control, disabled }: CRMPrioritySelectProps) {
  return (
    <FormField
      control={control}
      name="priority"
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1 select-none">
            Приоритет (Статус сделки)
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger className="bg-muted/30 border-none focus:ring-1 focus:ring-primary text-xs font-semibold rounded-xl h-10">
                <SelectValue placeholder="Выберите приоритет" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="border-none shadow-xl bg-background rounded-xl">
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value} className="cursor-pointer text-xs font-medium rounded-lg focus:bg-muted/50">
                  <div className="flex items-center gap-2 py-0.5">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", p.color)} />
                    <span>{p.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage className="text-[11px] font-medium text-destructive" />
        </FormItem>
      )}
    />
  );
}
