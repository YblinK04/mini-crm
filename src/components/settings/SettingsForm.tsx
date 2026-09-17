'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { updateProfile, type ActionState } from '@/app/(dashboard)/settings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';

export function SettingsForm() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  
  const [name, setName] = useState('');
  const lastProcessedSuccess = useRef(false);

  useEffect(() => {
    if (session?.user?.name && !name && !isPending) {
      setName(session.user.name);
    }
  }, [session?.user?.name, name, isPending]);

  
  useEffect(() => {
    if (state?.success && !lastProcessedSuccess.current) {
      lastProcessedSuccess.current = true;
      
      toast.success('Имя успешно изменено');

      
      update({ name }).then(() => {
        
        router.refresh();
      });
    }

    if (!state) {
        lastProcessedSuccess.current = false;
    }
  }, [state, update, name, router]);

  return (
    <form action={formAction} className="space-y-6" onSubmit={() => { lastProcessedSuccess.current = false; }}>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest px-1">
          Ваше имя пользователя
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            name="name" 
            value={name}
            onChange={(e) => {
                setName(e.target.value);
                lastProcessedSuccess.current = false;
            }}
            className="pl-10 h-12 bg-background/50 border-none ring-1 ring-border focus-visible:ring-2"
            placeholder="Введите имя"
            disabled={isPending}
          />
        </div>
        {state?.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isPending || name === session?.user?.name || !name.trim()} 
        className="w-full sm:w-auto px-10"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Сохранение...
          </>
        ) : (
          'Обновить профиль'
        )}
      </Button>
    </form>
  );
}