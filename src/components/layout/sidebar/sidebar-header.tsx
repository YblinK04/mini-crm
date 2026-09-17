'use client';

import Link from 'next/link';
import { LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  hideToggle?: boolean; 
}

export function SidebarHeader({ collapsed, onToggle, hideToggle }: SidebarHeaderProps) {
  return (
    <div className='flex h-14 items-center border-b px-4 shrink-0'>
      <Link href='/dashboard' className='flex items-center gap-2 font-semibold truncate'>
        <LayoutDashboard className='h-5 w-5 text-primary' />
        {!collapsed && <span>RealTask</span>}
      </Link>

      {!hideToggle && (
        <Button
          variant='ghost'
          size='icon'
          className={cn('ml-auto h-8 w-8', collapsed && 'mx-auto')}
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
        </Button>
      )}
    </div>
  );
}