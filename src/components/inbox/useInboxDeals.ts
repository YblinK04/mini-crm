'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInboxDeals, fetchPipelinesWithStages } from './api';

export const INBOX_DEALS_KEY = ['inbox-pipeline-deals'] as const;
export const INBOX_COUNT_KEY = ['inbox-pipeline-count'] as const;
export const PIPELINES_WITH_STAGES_KEY = ['pipelines-with-stages'] as const;

export function useInboxDeals() {
  return useQuery({
    queryKey: INBOX_DEALS_KEY,
    queryFn: fetchInboxDeals,
    refetchInterval: 15_000,
  });
}

export function usePipelinesWithStages() {
  return useQuery({
    queryKey: PIPELINES_WITH_STAGES_KEY,
    queryFn: fetchPipelinesWithStages,
  });
}