'use client';

import { type MouseEvent, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { type Deal } from '@/store/forms/useEditDealForm';
import { EditDealDialog } from './edit-deal-dialog';
import { Wallet, Building2, ExternalLink } from 'lucide-react';


type DealWithRelations = Deal & {
  company?: { name: string } | null;
};

interface TaskCardProps {
  deal: DealWithRelations;
  index: number;
}

export const CRM_PRIORITY_CONFIG: Record<
  string,
  { border: string; dot: string; text: string; label: string }
> = {
  URGENT: {
    border: 'border-l-[4px] border-l-red-500 hover:border-r-red-500/10',
    dot: 'bg-red-500 shadow-sm shadow-red-500/40',
    text: 'text-red-500 dark:text-red-400 bg-red-500/10',
    label: 'Критично',
  },
  HIGH: {
    border: 'border-l-[4px] border-l-orange-500 hover:border-r-orange-500/10',
    dot: 'bg-orange-500 shadow-sm shadow-orange-500/40',
    text: 'text-orange-500 dark:text-orange-400 bg-orange-500/10',
    label: 'Высокий',
  },
  MEDIUM: {
    border: 'border-l-[4px] border-l-amber-500 hover:border-r-amber-500/10',
    dot: 'bg-amber-500 shadow-sm shadow-amber-500/40',
    text: 'text-amber-500 dark:text-amber-400 bg-amber-500/10',
    label: 'Средний',
  },
  LOW: {
    border: 'border-l-[4px] border-l-emerald-500 dark:border-l-emerald-600',
    dot: 'bg-emerald-500 dark:bg-emerald-600 shadow-sm shadow-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    label: 'Низкий',
  },
};

export function TaskCard({ deal, index }: TaskCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: 'Deal',
      dealId: deal.id,
      stageId: deal.stageId,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayBudget = (deal.budget || 0) / 100;
  const currentPriority =
    CRM_PRIORITY_CONFIG[deal.priority] || CRM_PRIORITY_CONFIG.MEDIUM;

  const companyName = deal.company?.name;

  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    e.stopPropagation();
    setIsEditOpen(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        className={cn(
          'group flex flex-col p-4 bg-background border border-muted-foreground/15 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative select-none',
          currentPriority.border,
          isDragging &&
            'opacity-30 border-dashed border-primary/50 shadow-none scale-95',
        )}
      >
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center gap-1 bg-muted/80 backdrop-blur-sm text-muted-foreground px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-muted-foreground/10">
          <span>Открыть</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </div>

        <div className="flex items-start justify-between gap-2 mb-1 pr-14">
          <h4 className="text-xs font-bold text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors truncate max-w-[180px]">
            {deal.title}
          </h4>
        </div>

        {companyName ? (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3 truncate">
            <Building2 className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="truncate font-medium">{companyName}</span>
          </div>
        ) : (
          <div className="h-4 mb-3 invisible" />
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-muted/50">
          <div className="flex items-center gap-1 text-xs font-extrabold text-foreground tracking-tight">
            <Wallet className="w-3.5 h-3.5 text-emerald-500 opacity-80 shrink-0" />
            <span>{displayBudget.toLocaleString('ru-RU')} ₽</span>
          </div>

          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors',
              currentPriority.text,
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse',
                currentPriority.dot,
              )}
            />
            <span>{currentPriority.label}</span>
          </div>
        </div>
      </div>

      <EditDealDialog
        deal={deal}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}