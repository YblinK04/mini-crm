import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taskService } from '@/services/task.service';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export const metadata = {
  title: 'Панель управления',
};
type DashboardData = Parameters<typeof DashboardView>[0];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/dashboard')}`);
  }

  const { organizationId } = session.user;
  if (!organizationId) {
    redirect('/onboarding');
  }

  const [
    budgetAggregation,
    activeDealsCount,
    totalContactsCount,
    pipelinesCount,
    urgentDeals,
    upcoming,
  ] = await Promise.all([
    prisma.deal.aggregate({
      where: { organizationId },
      _sum: { budget: true },
    }),
    prisma.deal.count({ where: { organizationId } }),
    prisma.contact.count({ where: { organizationId } }),
    prisma.pipeline.count({ where: { organizationId } }),
    prisma.deal.findMany({
      where: {
        organizationId,
        priority: { in: ['URGENT', 'HIGH'] },
      },
      take: 5,
      orderBy: { budget: 'desc' },
      select: {
        id: true,
        title: true,
        budget: true,
        priority: true,
        pipelineId: true,
        company: { select: { name: true } },
      },
    }),
    taskService.getUpcoming(organizationId, 1),
  ]);

  const totalBudgetRaw = budgetAggregation._sum.budget ?? 0;

  const now = Date.now();
  const todayTasks = [...upcoming.overdue, ...upcoming.today]
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .map((task) => ({
      id: task.id,
      title: task.title,
      dueAt: task.dueAt.toISOString(),
      deal: task.deal
        ? {
            id: task.deal.id,
            title: task.deal.title,
            pipelineId: task.deal.pipelineId,
          }
        : null,
      isOverdue: !task.completedAt && task.dueAt.getTime() < now,
    }));

  const data: DashboardData = {
    totalBudgetRaw,
    activeDealsCount,
    totalContactsCount,
    pipelinesCount,
    urgentDeals,
    todayTasks,
  };

  return <DashboardView {...data} />;
}