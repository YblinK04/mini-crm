'use client';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ColorPicker } from '@/components/ui/color-picker';


export function ProjectFormFields({ control, disabled }: { control: any; disabled: boolean }) {
  return (
    <div className="space-y-4 pt-2">
      <FormField control={control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Название</FormLabel>
          <FormControl><Input {...field} disabled={disabled} className="bg-muted/30 border-none h-11" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={control} name="description" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Описание</FormLabel>
          <FormControl>
            <Textarea {...field} value={field.value || ''} disabled={disabled} className="resize-none bg-muted/30 border-none h-24" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={control} name="color" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Цвет</FormLabel>
          <FormControl><ColorPicker value={field.value} onChange={field.onChange} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}