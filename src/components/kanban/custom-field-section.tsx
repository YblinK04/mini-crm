'use client';

import React from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { CRMTextField } from './crm-text-field';
import { EditDealFormInputs } from '@/store/forms/useEditDealForm';

interface CustomFieldsSectionProps {
  control: Control<EditDealFormInputs>;
  disabled: boolean;
}

export function CustomFieldsSection({ control, disabled }: CustomFieldsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customFieldsArray',
  });

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between border-b pb-1">
        <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
          Дополнительные CRM поля ({fields.length})
        </span>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => append({ key: '', value: '' })} 
          disabled={disabled} 
          className="h-7 text-[10px] font-bold gap-1 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
        >
          <Plus className="w-3 h-3" /> 
          <span>Добавить поле</span>
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-[11px] text-muted-foreground/50 italic text-center py-3 bg-muted/10 rounded-xl border border-dashed select-none">
          У этой сделки нет кастомных полей. Добавьте телефон, адрес или ссылку.
        </div>
      ) : (
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <CRMTextField 
                control={control} 
                name={`customFieldsArray.${index}.key`} 
                placeholder="Название (напр. Telegram)" 
                disabled={disabled} 
                isCompact 
              />
              <CRMTextField 
                control={control} 
                name={`customFieldsArray.${index}.value`} 
                placeholder="Значение" 
                disabled={disabled} 
                isCompact 
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => remove(index)} 
                disabled={disabled} 
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
