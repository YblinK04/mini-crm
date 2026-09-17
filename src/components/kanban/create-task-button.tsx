'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateDealDialog } from './create-deal-dialog';

interface CreateDealButtonProps {
  pipelineId: string;
  stageId: string;
}

export function CreateTaskButton({ pipelineId, stageId }: CreateDealButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        size="sm" 
        className="gap-2 shadow-sm rounded-xl text-xs font-semibold h-9"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Добавить сделку</span>
      </Button>

      <CreateDealDialog 
        pipelineId={pipelineId}
        stageId={stageId} 
        open={open} 
        onOpenChange={setOpen} 
      />
    </>
  );
}
