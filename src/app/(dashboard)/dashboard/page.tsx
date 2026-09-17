import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { organizationId } = session.user;

  let totalBudgetRaw = 0;
  let activeDealsCount = 0;
  let totalContactsCount = 0;
  let urgentDeals: any[] = [];

  try {
    const [budgetAggregation, dealsCount, contactsCount, hotDeals] = await Promise.all([
      prisma.deal.aggregate({
        where: { organizationId },
        _sum: { budget: true }
      }),
      prisma.deal.count({
        where: { organizationId }
      }),
      prisma.contact.count({
        where: { organizationId }
      }),
      prisma.deal.findMany({
        where: { 
          organizationId,
          priority: { in: ['URGENT', 'HIGH'] }
        },
        take: 5,
        orderBy: { budget: 'desc' },
        select: {
          id: true,
          title: true,
          budget: true,
          priority: true,
          pipelineId: true,
          company: { select: { name: true } }
        }
      })
    ]);

    totalBudgetRaw = budgetAggregation._sum.budget ?? 0;
    activeDealsCount = dealsCount;
    totalContactsCount = contactsCount;
    urgentDeals = hotDeals;
  } catch (error) {
    console.error(' [CRM_DASHBOARD_METRICS_ERROR] Ошибка сбора аналитики из PostgreSQL:', error);
  }

  return (
    <DashboardView 
      totalBudgetRaw={totalBudgetRaw}
      activeDealsCount={activeDealsCount}
      totalContactsCount={totalContactsCount}
      urgentDeals={urgentDeals}
    />
  );
}
