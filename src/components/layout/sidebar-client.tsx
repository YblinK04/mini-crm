'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  CalendarCheck,
  LayoutDashboard,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { SidebarHeader } from './sidebar/sidebar-header';
import { SidebarFooter } from './sidebar/sidebar-footer';
import { SidebarSection } from './sidebar/sidebar-section';
import { SidebarNav } from './sidebar/sidebar-nav';
import { deletePipelineAction } from '@/app/(dashboard)/pipelines/actions';
import { CreatePipelineDialog } from '../projects/create-pipeline-dialog';

const SIDEBAR_PIPELINES_LIMIT = 5;
const COLLAPSED_KEY = 'sidebar:collapsed';

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

export function SidebarClient({
  pipelines,
  userRole,
  isMobile = false,
}: SidebarClientProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pipelinesOpen, setPipelinesOpen] = useState(true);

  const pathname = usePathname();
  const isCurrentlyCollapsed = isMobile ? false : collapsed;

  const hasOverflow = pipelines.length > SIDEBAR_PIPELINES_LIMIT;
  const visiblePipelines = hasOverflow
    ? pipelines.slice(0, SIDEBAR_PIPELINES_LIMIT)
    : pipelines;

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
        toast.error('У вас недостаточно прав для удаления воронки продаж');
        return;
      }

      if (
        !confirm(
          `Вы уверены, что хотите окончательно удалить воронку "${name}" со всеми этапами?`,
        )
      ) {
        return;
      }

      try {
        const result = await deletePipelineAction(id);
        if (result.success) {
          toast.success('Воронка продаж успешно удалена');
        } else {
          toast.error(result.error || 'Не удалось удалить воронку');
        }
      } catch (e) {
        console.error('[sidebar] deletePipelineAction failed', e);
        toast.error('Не удалось удалить воронку');
      }
    },
    [userRole],
  );

  const isPipelineActive = (id: string) =>
    pathname === `/pipelines/${id}` ||
    pathname.startsWith(`/pipelines/${id}/`);

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r bg-card transition-[width] duration-300',
        isCurrentlyCollapsed ? 'w-16' : 'w-64',
        isMobile && 'w-full border-none',
      )}
    >
      <SidebarHeader
        collapsed={isCurrentlyCollapsed}
        onToggle={toggleCollapsed}
        hideToggle={isMobile}
      />

      <nav
        aria-label="Основная навигация"
        className="space-y-0.5 px-3 pt-4"
      >
        <SidebarNav
          href="/dashboard"
          icon={LayoutDashboard}
          label="Дашборд"
          collapsed={isCurrentlyCollapsed}
        />
        <SidebarNav
          href="/today"
          icon={CalendarCheck}
          label="Сегодня"
          collapsed={isCurrentlyCollapsed}
        />
      </nav>

      <div className="flex min-h-0 flex-1 flex-col px-3 pt-6">
        {!isCurrentlyCollapsed ? (
          <div className="mb-1 flex items-center justify-between px-2">
            <button
              type="button"
              onClick={() => setPipelinesOpen((v) => !v)}
              className="group flex flex-1 items-center gap-1.5 text-left"
              aria-expanded={pipelinesOpen}
            >
              <ChevronDown
                className={cn(
                  'h-3 w-3 shrink-0 text-muted-foreground/40 transition-transform',
                  !pipelinesOpen && '-rotate-90',
                )}
                aria-hidden="true"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                Воронки {pipelines.length > 0 && `(${pipelines.length})`}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setCreateDialogOpen(true)}
              aria-label="Создать воронку"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="mb-2 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCreateDialogOpen(true)}
              aria-label="Создать воронку"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {pipelinesOpen && (
          <div className="flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1">
              <div className="max-h-[260px]">
                <SidebarSection
                  pipelines={visiblePipelines}
                  collapsed={isCurrentlyCollapsed}
                  isActive={isPipelineActive}
                  onDelete={handleDelete}
                />
              </div>
            </ScrollArea>

            {!isCurrentlyCollapsed && hasOverflow && (
              <Link
                href="/pipelines"
                className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <ArrowRight className="h-3 w-3" />
                <span>Все воронки ({pipelines.length})</span>
              </Link>
            )}

            {!isCurrentlyCollapsed && pipelines.length === 0 && (
              <div className="px-2 py-3 text-[11px] text-muted-foreground/50 italic">
                Нет воронок. Нажмите «+», чтобы создать.
              </div>
            )}
          </div>
        )}
      </div>

      <SidebarFooter collapsed={isCurrentlyCollapsed} />

      <CreatePipelineDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </aside>
  );
}