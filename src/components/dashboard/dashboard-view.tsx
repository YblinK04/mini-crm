'use client';

import {
  Wallet,
  Briefcase,
  Users,
  Kanban,
} from 'lucide-react';
import { TodayTasksWidget, type DashboardTask } from './today-tasks-widget';
import { MetricCard } from './MetricCard';
import { UrgentDealsWidget, type HotDeal } from './UrgentDealsWidget';

interface DashboardViewProps {
  totalBudgetRaw: number;
  activeDealsCount: number;
  totalContactsCount: number;
  pipelinesCount: number;
  urgentDeals: HotDeal[];
  todayTasks: DashboardTask[];
}

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

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Сделки в работе"
          value={`${activeDealsCount}`}
          suffix="шт."
          hint="Активные карточки"
          icon={<Briefcase className="h-4 w-4 text-primary" aria-hidden="true" />}
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
          icon={<Wallet className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
        />

        <MetricCard
          title="Контакты"
          value={`${totalContactsCount}`}
          suffix="чел."
          hint="Уникальные клиенты"
          icon={<Users className="h-4 w-4 text-blue-500" aria-hidden="true" />}
        />

        <MetricCard
          title="Воронки"
          value={`${pipelinesCount}`}
          suffix="шт."
          hint="Активные доски"
          icon={<Kanban className="h-4 w-4 text-violet-500" aria-hidden="true" />}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className={hasUrgent ? '' : 'md:col-span-2'}>
          <TodayTasksWidget tasks={todayTasks} />
        </div>

        {hasUrgent && <UrgentDealsWidget deals={urgentDeals} />}
      </div>
    </div>
  );
}