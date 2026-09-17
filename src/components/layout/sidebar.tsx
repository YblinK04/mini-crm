import { Role } from '@prisma/client';
import { SidebarClient } from './sidebar-client';

interface SidebarProps {
  pipelines: {
    id: string;
    name: string;
    organizationId: string;
    createdAt?: string; 
    updatedAt?: string; 
  }[];
  userRole: Role;
  userId: string;
}
export function Sidebar({ pipelines, userRole, userId }: SidebarProps) {
  const safePipelines = pipelines.map(p => ({
    id: p.id,
    name: p.name,
    organizationId: p.organizationId,
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
  }));

  return (
    <SidebarClient 
      pipelines={safePipelines} 
      userRole={userRole} 
    />
  );
}
