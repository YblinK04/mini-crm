// src/store/useDealStore.ts
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PipelineDataDTO } from '@/services/pipeline.service';

export type KanbanDeal = PipelineDataDTO['stages'][number]['deals'][number];
export type KanbanStage = PipelineDataDTO['stages'][number];

interface DealStoreState {
  pipelineId: string | null;
  stages: KanbanStage[];
  isLoading: boolean;
  error: string | null;
  backupStages: KanbanStage[] | null;

  /**
   * Сделка, открытая в диалоге редактирования.
   * null — диалог закрыт. Управляется openDealForEdit / closeDealEdit.
   */
  editingDeal: KanbanDeal | null;

  setPipelineData: (data: PipelineDataDTO) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  /** Открыть диалог редактирования указанной сделки. */
  openDealForEdit: (deal: KanbanDeal) => void;

  /** Закрыть диалог редактирования. */
  closeDealEdit: () => void;

  moveDealOptimistic: (payload: {
    dealId: string;
    fromStageId: string;
    toStageId: string;
    newOrder: number;
  }) => void;

  addDealOptimistic: (stageId: string, deal: KanbanDeal) => void;
  updateDealOptimistic: (
    dealId: string,
    updatedFields: Partial<KanbanDeal>,
  ) => void;
  deleteDealOptimistic: (stageId: string, dealId: string) => void;

  // 🔥 КРИТИЧЕСКОЕ ДОБАВЛЕНИЕ: метод для синхронизации ID после ответа сервера
  updateDealIdInState: (temporaryId: string, serverId: string) => void;

  rollbackOptimisticAction: () => void;
  clearBackup: () => void;
}

export const useDealStore = create<DealStoreState>()(
  devtools(
    (set) => ({
      pipelineId: null,
      stages: [],
      isLoading: false,
      error: null,
      backupStages: null,
      editingDeal: null,

      setPipelineData: (data) =>
        set(
          {
            pipelineId: data.id,
            stages: data.stages,
            isLoading: false,
            error: null,
          },
          false,
          'setPipelineData',
        ),

      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
      setError: (error) => set({ error }, false, 'setError'),

      clearBackup: () => set({ backupStages: null }, false, 'clearBackup'),

      openDealForEdit: (deal) =>
        set({ editingDeal: deal }, false, 'openDealForEdit'),

      closeDealEdit: () =>
        set({ editingDeal: null }, false, 'closeDealEdit'),

      rollbackOptimisticAction: () =>
        set(
          (state) => {
            if (!state.backupStages) return {};
            console.warn(
              '⚠️ [CRM_STORE_ROLLBACK] Выполнен экстренный откат UI к стабильному стейту базы данных.',
            );
            return {
              stages: state.backupStages,
              backupStages: null,
            };
          },
          false,
          'rollbackOptimisticAction',
        ),

      updateDealIdInState: (temporaryId, serverId) =>
        set(
          (state) => {
            const updatedStages = state.stages.map((stage) => ({
              ...stage,
              deals: stage.deals.map((deal) => {
                if (deal.id === temporaryId) {
                  return { ...deal, id: serverId };
                }
                return deal;
              }),
            }));

            return { stages: updatedStages };
          },
          false,
          'updateDealIdInState',
        ),

      moveDealOptimistic: ({ dealId, fromStageId, toStageId, newOrder }) =>
        set(
          (state) => {
            const currentBackup = state.backupStages
              ? state.backupStages
              : state.stages.map((s) => ({
                  ...s,
                  deals: s.deals.map((d) => ({ ...d })),
                }));

            const updatedStages = state.stages.map((s: KanbanStage) => ({
              ...s,
              deals: s.deals.map((d: KanbanDeal) => ({ ...d })),
            }));

            if (fromStageId === toStageId) {
              const stage = updatedStages.find(
                (s: KanbanStage) => s.id === fromStageId,
              );
              if (!stage) return {};

              const dealIdx = stage.deals.findIndex(
                (d: KanbanDeal) => d.id === dealId,
              );
              if (dealIdx === -1) return {};

              const [movedDeal] = stage.deals.splice(dealIdx, 1);
              stage.deals.splice(newOrder, 0, movedDeal);

              stage.deals = stage.deals.map((d: KanbanDeal, idx: number) => ({
                ...d,
                order: idx,
              }));

              return {
                stages: updatedStages,
                backupStages: currentBackup,
              };
            }

            const fromStage = updatedStages.find((s) => s.id === fromStageId);
            const toStage = updatedStages.find((s) => s.id === toStageId);

            if (!fromStage || !toStage) return {};

            const dealIdx = fromStage.deals.findIndex(
              (d: KanbanDeal) => d.id === dealId,
            );
            if (dealIdx === -1) return {};

            const [targetDeal] = fromStage.deals.splice(dealIdx, 1);

            const movedDeal: KanbanDeal = {
              ...targetDeal,
              stageId: toStageId,
            };

            fromStage.deals = fromStage.deals.map(
              (d: KanbanDeal, idx: number) => ({ ...d, order: idx }),
            );
            fromStage.totalBudget = fromStage.deals.reduce(
              (sum: number, d: KanbanDeal) => sum + d.budget,
              0,
            );

            toStage.deals.splice(newOrder, 0, movedDeal);

            toStage.deals = toStage.deals.map(
              (d: KanbanDeal, idx: number) => ({ ...d, order: idx }),
            );
            toStage.totalBudget = toStage.deals.reduce(
              (sum: number, d: KanbanDeal) => sum + d.budget,
              0,
            );

            return {
              stages: updatedStages,
              backupStages: currentBackup,
            };
          },
          false,
          'moveDealOptimistic',
        ),

      addDealOptimistic: (stageId, deal) =>
        set(
          (state) => {
            const currentBackup = state.backupStages
              ? state.backupStages
              : state.stages.map((s) => ({
                  ...s,
                  deals: s.deals.map((d) => ({ ...d })),
                }));

            const updatedStages = state.stages.map((s) => {
              if (s.id !== stageId) return s;

              const lastDeal = s.deals[s.deals.length - 1];
              const nextOrder = lastDeal ? lastDeal.order + 1 : 0;

              const newDealWithOrder = { ...deal, order: nextOrder };
              const newDeals = [...s.deals, newDealWithOrder];

              const newTotalBudget = newDeals.reduce(
                (sum: number, d: KanbanDeal) => sum + d.budget,
                0,
              );

              return {
                ...s,
                deals: newDeals,
                totalBudget: newTotalBudget,
              };
            });

            return { stages: updatedStages, backupStages: currentBackup };
          },
          false,
          'addDealOptimistic',
        ),

      updateDealOptimistic: (dealId, updatedFields) =>
        set(
          (state) => {
            const currentBackup = state.backupStages
              ? state.backupStages
              : state.stages.map((s) => ({
                  ...s,
                  deals: s.deals.map((d) => ({ ...d })),
                }));

            const updatedStages = state.stages.map((s) => {
              const hasDeal = s.deals.some(
                (d: KanbanDeal) => d.id === dealId,
              );
              if (!hasDeal) return s;

              const newDeals = s.deals.map((d: KanbanDeal) => {
                if (d.id !== dealId) return d;
                return { ...d, ...updatedFields };
              });

              const newTotalBudget = newDeals.reduce(
                (sum: number, d: KanbanDeal) => sum + d.budget,
                0,
              );

              return {
                ...s,
                deals: newDeals,
                totalBudget: newTotalBudget,
              };
            });

            return { stages: updatedStages, backupStages: currentBackup };
          },
          false,
          'updateDealOptimistic',
        ),

      deleteDealOptimistic: (stageId, dealId) =>
        set(
          (state) => {
            const currentBackup = state.backupStages
              ? state.backupStages
              : state.stages.map((s) => ({
                  ...s,
                  deals: s.deals.map((d) => ({ ...d })),
                }));

            const updatedStages = state.stages.map((s) => {
              if (s.id !== stageId) return s;

              const newDeals = s.deals
                .filter((d: KanbanDeal) => d.id !== dealId)
                .map((d: KanbanDeal, idx: number) => ({ ...d, order: idx }));

              const newTotalBudget = newDeals.reduce(
                (sum: number, d: KanbanDeal) => sum + d.budget,
                0,
              );

              return {
                ...s,
                deals: newDeals,
                totalBudget: newTotalBudget,
              };
            });

            return { stages: updatedStages, backupStages: currentBackup };
          },
          false,
          'deleteDealOptimistic',
        ),
    }),
    { name: 'CRM_Core_Deal_Store' },
  ),
);