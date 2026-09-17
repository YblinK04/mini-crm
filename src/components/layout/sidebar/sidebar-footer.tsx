'use client';

import Link from 'next/link';
import { Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div className='border-t p-3 space-y-1 shrink-0'>
      <Button
        variant='ghost'
        size={collapsed ? 'icon' : 'default'}
        className={cn('w-full justify-start', collapsed && 'justify-center')}
        asChild
      >
        <Link href='/settings'>
          <Settings className='h-4 w-4' />
          {!collapsed && <span className='ml-2 font-medium'>Настройки</span>}
        </Link>
      </Button>
      <Button
        variant='ghost'
        size={collapsed ? 'icon' : 'default'}
        className={cn(
          'w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10',
          collapsed && 'justify-center'
        )}
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        <LogOut className='h-4 w-4' />
        {!collapsed && <span className='ml-2 font-medium'>Выйти</span>}
      </Button>
    </div>
  );
}