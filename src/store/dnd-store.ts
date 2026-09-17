'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { KanbanDeal } from './useDealStore';

interface DnDState {
  draggedDeal: KanbanDeal | null;
  targetStageId: string | null;

  setDraggedDeal: (deal: KanbanDeal | null) => void;
  setTargetStageId: (stageId: string | null) => void;
  reset: () => void;
}

export const useDndStore = create<DnDState>()(
  devtools(
    (set) => ({
      draggedDeal: null,
      targetStageId: null,

      setDraggedDeal: (deal) => set({ draggedDeal: deal }, false, 'setDraggedDeal'),
      setTargetStageId: (stageId) => set({ targetStageId: stageId }, false, 'setTargetStageId'),

      reset: () => set({ draggedDeal: null, targetStageId: null }, false, 'reset'),
    }),
    { name: 'CRM_Kanban_DnD_Store' }
  )
);
