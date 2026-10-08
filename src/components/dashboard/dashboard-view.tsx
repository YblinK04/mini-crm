
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Briefcase,
  Users,
  Kanban,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  TodayTasksWidget,
  type DashboardTask,
} from './today-tasks-widget';

type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface HotDeal {
  id: string;
  title: string;
  budget: number;
  priority: DealPriority;
  pipelineId: string;
  company: { name: string } | null;
}

interface DashboardViewProps {
  totalBudgetRaw: number;
  activeDealsCount: number;
  totalContactsCount: number;
  pipelinesCount: number;
  urgentDeals: HotDeal[];
  todayTasks: DashboardTask[];
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

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function DashboardView({
  totalBudgetRaw,
  activeDealsCount,
  totalContactsCount,
  pipelinesCount,
  urgentDeals,
  todayTasks,
}: DashboardViewProps) {
  const hasUrgent = urgentDeals.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Панель управления
        </h1>
        <p className="text-sm text-muted-foreground">
          Сводка по вашим сделкам и клиентам.
        </p>
      </div>

      {/* 4 метрики */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Сделки в работе"
          value={`${activeDealsCount}`}
          suffix="шт."
          hint="Активные карточки"
          icon={
            <Briefcase className="h-4 w-4 text-primary" aria-hidden="true" />
          }
        />

        <MetricCard
          title="Деньги в работе"
          value={
            activeDealsCount === 0
              ? '—'
              : formatCurrency(totalBudgetRaw / 100)
          }
          hint={
            activeDealsCount === 0
              ? 'Нет сделок'
              : totalBudgetRaw === 0
                ? 'Бюджеты не заполнены'
                : 'Сумма бюджетов'
          }
          icon={
            <Wallet
              className="h-4 w-4 text-emerald-500"
              aria-hidden="true"
            />
          }
        />

        <MetricCard
          title="Контакты"
          value={`${totalContactsCount}`}
          suffix="чел."
          hint="Уникальные клиенты"
          icon={
            <Users className="h-4 w-4 text-blue-500" aria-hidden="true" />
          }
        />

        <MetricCard
          title="Воронки"
          value={`${pipelinesCount}`}
          suffix="шт."
          hint="Активные доски"
          icon={
            <Kanban className="h-4 w-4 text-violet-500" aria-hidden="true" />
          }
        />
      </div>

      {/* Двухколоночный блок: задачи | горящие сделки */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className={hasUrgent ? '' : 'md:col-span-2'}>
          <TodayTasksWidget tasks={todayTasks} />
        </div>

        {hasUrgent && (
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
                {urgentDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between rounded-xl border border-transparent p-2.5 transition-colors hover:border-muted-foreground/10 hover:bg-muted/20"
                  >
                    <div className="flex min-w-0 flex-col pr-3">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {deal.title}
                      </span>
                      {deal.company?.name && (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {deal.company.name}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant="destructive"
                        className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      >
                        {PRIORITY_LABEL[deal.priority]}
                      </Badge>
                      <span className="text-xs font-extrabold tabular-nums text-foreground">
                        {formatCurrency(deal.budget / 100)}
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
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  suffix?: string;
  hint: string;
  icon: ReactNode;
}

function MetricCard({ title, value, suffix, hint, icon }: MetricCardProps) {
  return (
    <Card className="border-none shadow-md bg-background">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold tracking-tight text-foreground">
            {value}
          </span>
          {suffix && (
            <span className="text-sm font-semibold text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        <p className="pt-1 text-[10px] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}