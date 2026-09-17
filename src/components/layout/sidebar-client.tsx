'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { SidebarHeader } from './sidebar/sidebar-header';
import { SidebarFooter } from './sidebar/sidebar-footer';
import { SidebarSection } from './sidebar/sidebar-section';
import { deletePipelineAction } from '@/app/(dashboard)/pipelines/actions'; 
import { CreatePipelineDialog } from '../projects/create-pipeline-dialog';

interface SidebarClientProps {
  pipelines: {
    id: string;
    name: string;
    organizationId: string;
    createdAt: string; 
    updatedAt: string;
  }[];
  
  userRole: string;
  isMobile?: boolean; 
}

export function SidebarClient({ pipelines, userRole, isMobile = false }: SidebarClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const pathname = usePathname();

  const isCurrentlyCollapsed = isMobile ? false : collapsed;

  
  const handleDelete = async (id: string, name: string) => {
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      toast.error('У вас недостаточно прав для удаления воронки продаж');
      return;
    }

    if (!confirm(`Вы уверены, что хотите окончательно удалить воронку "${name}" со всеми этапами?`)) {
      return;
    }

    const result = await deletePipelineAction(id);

    if (result.success) {
      toast.success('Воронка продаж успешно удалена');
    } else {
      toast.error(result.error || 'Не удалось удалить воронку');
    }
  };

  return (
    <aside className={cn(
      'flex h-full flex-col border-r bg-card transition-all duration-300',
      isCurrentlyCollapsed ? 'w-16' : 'w-64',
      isMobile && 'w-full border-none' 
    )}>
      <SidebarHeader 
        collapsed={isCurrentlyCollapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
        hideToggle={isMobile} 
      />

      <div className="flex-1 overflow-hidden py-4 px-3">
        {!isCurrentlyCollapsed && (
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">
              Воронки продаж
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <ScrollArea className="h-full">
          <SidebarSection 
            title="Активные воронки" 
            pipelines={pipelines} 
            collapsed={isCurrentlyCollapsed} 
            isActive={(id: string) => pathname === `/pipelines/${id}`} 
            onDelete={handleDelete}
          />
        </ScrollArea>
      </div>

       <SidebarFooter collapsed={isCurrentlyCollapsed} />
      
      <CreatePipelineDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </aside>
  );
}