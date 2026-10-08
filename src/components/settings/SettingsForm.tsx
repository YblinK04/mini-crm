'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  updateProfile,
  type ActionState,
} from '@/app/(dashboard)/settings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function SettingsForm() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(updateProfile, null);

  const [name, setName] = useState('');
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    if (session?.user?.name) {
      setName(session.user.name);
      seeded.current = true;
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (state?.success) {
      toast.success('Имя сохранено');
     
      update().then(() => router.refresh());
    }
  }, [state, update, router]);

  const sessionName = session?.user?.name ?? '';
  const isUnchanged = name.trim() === sessionName.trim();
  const fieldError = state?.fieldErrors?.name;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="text-xs font-medium text-muted-foreground"
        >
          Имя
        </Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10"
          placeholder="Введите имя"
          disabled={isPending}
          autoComplete="name"
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? 'name-error' : undefined}
        />
        {fieldError && (
          <p id="name-error" className="text-xs text-destructive">
            {fieldError}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending || isUnchanged || !name.trim()}
        className="w-full sm:w-auto px-6 h-10"
      >
        {isPending ? (
          <>
            <Loader2
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
            Сохранение...
          </>
        ) : (
          'Сохранить'
        )}
      </Button>
    </form>
  );
}