'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface HotDeal {
  id: string;
  title: string;
  budget: number;
  priority: DealPriority;
  pipelineId: string;
  company: { name: string } | null;
}

interface UrgentDealsWidgetProps {
  deals: HotDeal[];
}

const PRIORITY_LABEL: Record<DealPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Критично',
};

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export function UrgentDealsWidget({ deals }: UrgentDealsWidgetProps) {
  if (deals.length === 0) return null;

  return (
    <Card className="border-none shadow-md bg-background">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle
            className="w-4 h-4 text-destructive"
            aria-hidden="true"
          />
          <CardTitle className="text-base font-bold text-foreground">
            Горящие сделки
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="flex items-center justify-between rounded-xl border border-transparent p-2.5 transition-colors hover:border-muted-foreground/10 hover:bg-muted/20 gap-2"
            >
              <div className="flex min-w-0 flex-col pr-1">
                <span className="truncate text-sm font-semibold text-foreground">
                  {deal.title}
                </span>
                {deal.company?.name && (
                  <span className="truncate text-[11px] text-muted-foreground">
                    {deal.company.name}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Badge
                  variant="destructive"
                  className="hidden sm:inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                >
                  {PRIORITY_LABEL[deal.priority]}
                </Badge>
                <span className="text-xs font-extrabold tabular-nums text-foreground">
                  {currencyFormatter.format(deal.budget / 100)}
                </span>
                <Link
                  href={`/pipelines/${deal.pipelineId}?openDeal=${deal.id}`}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  aria-label={`Открыть сделку ${deal.title}`}
                >
                  <ArrowUpRight
                    className="w-4 h-4"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}