import type { InboxDeal, PipelineWithStages } from './types';

async function parseJson<T>(res: Response, errorMessage: string): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error || errorMessage,
    );
  }
  return res.json();
}

export async function fetchInboxDeals(): Promise<InboxDeal[]> {
  const res = await fetch('/api/inbox-pipeline');
  return parseJson<InboxDeal[]>(res, 'Не удалось загрузить входящие');
}

export async function fetchPipelinesWithStages(): Promise<PipelineWithStages[]> {
  const res = await fetch('/api/pipelines/with-stages');
  return parseJson<PipelineWithStages[]>(res, 'Не удалось загрузить воронки');
}

export interface MoveDealResponse {
  pipeline: { id: string; name: string };
}

export async function moveDealToPipeline(
  dealId: string,
  pipelineId: string,
): Promise<MoveDealResponse> {
  const res = await fetch(`/api/deals/${dealId}/move-to-pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pipelineId }),
  });
  return parseJson<MoveDealResponse>(res, 'Не удалось переместить');
}