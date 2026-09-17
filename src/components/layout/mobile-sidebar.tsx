// src/components/layout/mobile-sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SidebarClient } from './sidebar-client';
import { Button } from '@/components/ui/button';

export interface SidebarPipeline {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface MobileSidebarProps {
  pipelines: SidebarPipeline[];
  userRole: string; 
}

export function MobileSidebar({ pipelines, userRole }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden"> 
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted/50 rounded-xl transition-colors">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 border-none bg-background shadow-2xl">
          <SheetTitle className="sr-only">Меню навигации CRM</SheetTitle>
          
          <SidebarClient 
            pipelines={pipelines} 
            isMobile={true} 
            userRole={userRole}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
