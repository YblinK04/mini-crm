'use client';

import { useMemo } from 'react';
import { useInboxDeals, usePipelinesWithStages } from './useInboxDeals';
import { useMoveDeal } from './useMoveDeal';
import { InboxDealItem } from './InboxDealItem';
import { InboxEmpty, InboxLoading } from './InboxStates';
import type { PipelineWithStages } from './types';

export function InboxList() {
  const { data: deals = [], isLoading } = useInboxDeals();
  const { data: pipelines = [] } = usePipelinesWithStages();
  const moveMutation = useMoveDeal();

  const targetPipelines: PipelineWithStages[] = useMemo(
    () =>
      pipelines.filter(
        (p) => !p.isInbox && (p.stages?.length ?? 0) > 0,
      ),
    [pipelines],
  );

  if (isLoading) return <InboxLoading />;
  if (deals.length === 0) return <InboxEmpty />;

  return (
    <ul className="border rounded-2xl overflow-hidden bg-card list-none p-0 m-0">
      {deals.map((deal, idx) => (
        <InboxDealItem
          key={deal.id}
          deal={deal}
          isLast={idx === deals.length - 1}
          targetPipelines={targetPipelines}
          isMoving={
            moveMutation.isPending &&
            moveMutation.variables?.dealId === deal.id
          }
          disabled={moveMutation.isPending}
          onMove={(pipelineId) =>
            moveMutation.mutate({ dealId: deal.id, pipelineId })
          }
        />
      ))}
    </ul>
  );
}