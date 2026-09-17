import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { pipelineService } from '@/services/pipeline.service';
import { type Pipeline } from '@prisma/client';

import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';


interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { id: userId, organizationId, role } = session.user;

  let pipelines: Pipeline[] = [];

  try {
    pipelines = await pipelineService.getOrganizationPipelines(organizationId);
  } catch (error) {
    console.error(' [CRM_LAYOUT_DATA_ERROR] Не удалось загрузить воронки для сайдбара:', error);
  }

  const serializedPipelines = pipelines.map((pipe: Pipeline) => ({
    id: pipe.id,
    name: pipe.name,
    organizationId: pipe.organizationId,
    createdAt: pipe.createdAt instanceof Date ? pipe.createdAt.toISOString() : String(pipe.createdAt),
    updatedAt: pipe.updatedAt instanceof Date ? pipe.updatedAt.toISOString() : String(pipe.updatedAt),
  }));

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      <Sidebar 
        pipelines={serializedPipelines} 
        userRole={role}
        userId={userId}
      />

      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Header user={session.user} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 bg-muted/10 relative">
          {children}
        </main>
      </div>
    </div>
  );
}