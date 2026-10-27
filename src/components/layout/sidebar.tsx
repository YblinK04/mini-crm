'use client'; 

import { Role } from '@prisma/client';
import { SidebarClient } from './sidebar-client';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';

interface SidebarProps {
  pipelines: {
    id: string;
    name: string;
    organizationId: string;
    createdAt?: string; 
    updatedAt?: string; 
  }[];
  userRole: Role;
  userId: string;
}

export function Sidebar({ pipelines, userRole, userId }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  const safePipelines = pipelines.map(p => ({
    id: p.id,
    name: p.name,
    organizationId: p.organizationId,
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
  }));

  return (
    <>
      <aside className="hidden md:flex h-full">
        <SidebarClient 
          pipelines={safePipelines} 
          userRole={userRole} 
        />
      </aside>

      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px]">
            <SheetTitle className="sr-only">Навигационное меню</SheetTitle>
            <SidebarClient 
              pipelines={safePipelines} 
              userRole={userRole} 
              isMobile={true} 
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}