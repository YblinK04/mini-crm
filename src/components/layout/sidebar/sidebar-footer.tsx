'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, LogOut, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut({ callbackUrl: '/' });
      // При успехе произойдёт редирект — компонент размонтируется.
    } catch {
      setSigningOut(false);
      toast.error('Не удалось выйти. Попробуйте ещё раз.');
    }
  };

  return (
    <div className="border-t p-3 space-y-1 shrink-0">
      <Button
        variant="ghost"
        size={collapsed ? 'icon' : 'default'}
        className={cn('w-full justify-start', collapsed && 'justify-center')}
        asChild
      >
        <Link href="/settings" aria-label="Настройки">
          <Settings className="h-4 w-4" />
          {!collapsed && <span className="ml-2 font-medium">Настройки</span>}
        </Link>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size={collapsed ? 'icon' : 'default'}
        className={cn(
          'w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10',
          collapsed && 'justify-center',
        )}
        onClick={handleSignOut}
        disabled={signingOut}
        aria-label={collapsed ? 'Выйти' : undefined}
      >
        {signingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {!collapsed && (
          <span className="ml-2 font-medium">
            {signingOut ? 'Выходим...' : 'Выйти'}
          </span>
        )}
      </Button>
    </div>
  );
}