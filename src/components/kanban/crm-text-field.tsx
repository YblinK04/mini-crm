'use client';

import React from 'react';
import { Control, FieldPath } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EditDealFormInputs } from '@/store/forms/useEditDealForm';
import { cn } from '@/lib/utils';

interface CRMTextFieldProps {
  control: Control<EditDealFormInputs>;
  name: FieldPath<EditDealFormInputs>;
  label?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  isTextArea?: boolean;
  isBudget?: boolean;
  isCompact?: boolean;
}

export function CRMTextField({ 
  control, 
  name, 
  label, 
  placeholder, 
  type = 'text', 
  disabled, 
  isTextArea, 
  isBudget, 
  isCompact 
}: CRMTextFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={isCompact ? "flex-1 space-y-0" : "space-y-1"}>
          {label && (
            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1 select-none">
              {label}
            </FormLabel>
          )}
          <FormControl>
            {isTextArea ? (
              <Textarea 
                {...field} 
                value={field.value?.toString() || ''} 
                placeholder={placeholder} 
                disabled={disabled} 
                className="resize-none h-20 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-sm p-3 leading-relaxed" 
              />
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  "bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-sm", 
                  isCompact ? "h-9 text-xs" : "h-10 font-medium",
                  fieldState.error && "ring-1 ring-destructive"
                )}
                value={field.value === null || field.value === undefined ? '' : field.value.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (type === 'number' || isBudget) {
                    const parsed = parseFloat(val);
                    field.onChange(isNaN(parsed) ? 0 : parsed);
                  } else {
                    field.onChange(val);
                  }
                }}
              />
            )}
          </FormControl>
          {!isCompact && <FormMessage className="text-[11px] font-medium text-destructive" />}
        </FormItem>
      )}
    />
  );
}
