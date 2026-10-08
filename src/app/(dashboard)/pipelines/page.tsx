
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { pipelineService } from '@/services/pipeline.service';
import { PipelinesList } from '@/components/projects/pipelines-list';

export const metadata = {
  title: 'Воронки продаж',
};

export default async function PipelinesListPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organizationId } = session.user;
  if (!organizationId) {
    redirect('/onboarding');
  }

  const pipelines =
    await pipelineService.getOrganizationPipelinesWithCounts(organizationId);

  const serialized = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    stagesCount: p._count.stages,
    dealsCount: p._count.deals,
    color: p.stages[0]?.color ?? '#3b82f6',
  }));

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Воронки продаж</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Все ваши рабочие пространства.
        </p>
      </div>

      <PipelinesList pipelines={serialized} />
    </div>
  );
}