'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/react-query';
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { FileText, Folder, Search } from 'lucide-react';

interface SearchResponse {
  projects: {
    id: string;
    name: string;
  }[];
  tasks: {
    id: string;
    title: string;
    projectId: string;
  }[];
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const { data } = useQuery<SearchResponse>({
    queryKey: ['search', search],
    queryFn: () => api.get(`/api/search?q=${search}`),
    enabled: search.length > 2, 
  });

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg border hover:bg-muted transition-colors w-full max-w-[260px]"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Поиск...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-sans text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Найти проект или задачу..." 
          onValueChange={setSearch} 
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>По вашему запросу ничего не найдено.</CommandEmpty>
          
          {data?.projects && data.projects.length > 0 && (
            <CommandGroup heading="Проекты">
              {data.projects.map((p) => (
                <CommandItem 
                  key={p.id} 
                  value={p.name}
                  onSelect={() => runCommand(() => router.push(`/projects/${p.id}`))}
                  className="cursor-pointer"
                >
                  <Folder className="mr-2 h-4 w-4 opacity-70" /> 
                  <span>{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data?.tasks && data.tasks.length > 0 && (
            <CommandGroup heading="Задачи">
              {data.tasks.map((t) => (
                <CommandItem 
                  key={t.id} 
                  value={t.title}
                  onSelect={() => runCommand(() => router.push(`/projects/${t.projectId}`))}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4 opacity-70" /> 
                  <span>{t.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}