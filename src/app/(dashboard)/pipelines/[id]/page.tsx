
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { pipelineService } from '@/services/pipeline.service';
import KanbanBoard from '@/components/kanban/kanban-board';

interface PipelinePageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    openDeal?: string;
  }>;
}

export default async function PipelinesPage({
  params,
  searchParams,
}: PipelinePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organizationId } = session.user;
  if (!organizationId) {
    redirect('/onboarding');
  }

  const resolvedParams = await params;
  const pipelineId = resolvedParams.id;

  const resolvedSearchParams = await searchParams;
  const openDeal = resolvedSearchParams.openDeal;

  if (!pipelineId) {
    notFound();
  }

  try {
    const pipelineData = await pipelineService.getPipelineData(
      pipelineId,
      organizationId,
    );

    if (!pipelineData) {
      notFound();
    }

    const serializedPipeline = {
      id: pipelineData.id,
      name: pipelineData.name,
      organizationId: pipelineData.organizationId,
      createdAt: pipelineData.createdAt.toISOString(),
      updatedAt: pipelineData.updatedAt.toISOString(),
      stages: pipelineData.stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        color: stage.color,
        order: stage.order,
        pipelineId: stage.pipelineId,
        totalBudget: stage.totalBudget,
        deals: stage.deals.map((deal) => ({
          id: deal.id,
          title: deal.title,
          description: deal.description,
          budget: deal.budget,
          priority: deal.priority,
          order: deal.order,
          closeDate: deal.closeDate ? deal.closeDate.toISOString() : null,
          pipelineId: deal.pipelineId,
          stageId: deal.stageId,
          assigneeId: deal.assigneeId,
          companyId: deal.companyId,
          organizationId: deal.organizationId,

          customFields: deal.customFields,

          createdAt: deal.createdAt.toISOString(),
          updatedAt: deal.updatedAt.toISOString(),
          company: deal.company ? { name: deal.company.name } : null,
          assignee: deal.assignee
            ? {
                id: deal.assignee.id,
                name: deal.assignee.name,
                image: deal.assignee.image,
              }
            : null,
          contacts: deal.contacts.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            phone: c.phone,
          })),
        })),
      })),
    };

    return (
      <div className="h-full flex flex-col space-y-4 overflow-hidden animate-in fade-in duration-200">
        <div className="flex items-center justify-between shrink-0 select-none">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Воронка продаж:{' '}
              <span className="text-primary">{serializedPipeline.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Рабочая область управления лидами и коммерческими сделками.
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <KanbanBoard
            initialData={serializedPipeline as any}
            initialOpenDealId={openDeal}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error(
      `[CRM_PIPELINES_ROUTE_CRITICAL_ERROR] Ошибка загрузки роута ${pipelineId}:`,
      error,
    );
    notFound();
  }
}