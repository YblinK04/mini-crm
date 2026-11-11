export type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface InboxDeal {
  id: string;
  title: string;
  priority: DealPriority;
  createdAt: string;
  contacts: { firstName: string; lastName: string | null }[];
  messages: { content: string; createdAt: string }[];
  bayesLabel: string | null;
}

export interface PipelineWithStages {
  id: string;
  name: string;
  isInbox?: boolean;
  stages: { id: string; name: string; color: string; order: number }[];
}