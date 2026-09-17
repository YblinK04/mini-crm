'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';


interface ProjectItemProps {
    project: {
        id: string;
        name: string;
        color: string;
    };
    collapsed: boolean;
    isActive: boolean;
}

export function ProjectItem({project, collapsed, isActive}: ProjectItemProps) {
    return (
        <Button
         variant={isActive ? 'secondary' : 'ghost'}
         size={collapsed ? 'icon' : 'default'}
         className={cn(
            'w-full justify-start',
            collapsed ? 'justify-center px-2' : 'px-3',
            isActive && 'bg-accent'
         )}
         asChild
         title={collapsed ? project.name : undefined}
        >
            <Link href={`/projects/${project.id}`} className='flex items-center w-full'>
              <div 
               className='h-2 w-2 shrink-0 rounded-full'
               style={{backgroundColor: project.color}}
               aria-hidden='true'
              />
              {!collapsed && (
                <span className='ml-3 truncate text-sm font-medium'>
                    {project.name}
                </span>
              )}
             {collapsed && <span className='sr-only'>{project.name}</span>}
            </Link>
        </Button>
    )
}