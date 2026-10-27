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
import { Briefcase, Users, Search } from 'lucide-react';

interface SearchResponse {
  pipelines: {
    id: string;
    name: string;
  }[];
  contacts: {
    id: string;
    firstName: string;
    lastName: string | null;
  }[];
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

  const { data, isFetching } = useQuery<SearchResponse>({
    queryKey: ['search', debouncedSearch],
    queryFn: () => api.get(`/api/search?q=${encodeURIComponent(debouncedSearch)}`),
    enabled: debouncedSearch.length > 2, 
    staleTime: 1000 * 60, 
  });

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => setSearch(''), 300);
    }
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть глобальный поиск"
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg border hover:bg-muted transition-colors w-full max-w-[260px]"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">Поиск...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-sans text-[10px] font-medium opacity-100 shrink-0">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput 
          placeholder="Найти воронку или клиента..." 
          value={search}
          onValueChange={setSearch} 
        />
        <CommandList className="max-h-[400px]">
          {!isFetching && (
            <CommandEmpty>По вашему запросу ничего не найдено.</CommandEmpty>
          )}
          
          {data?.pipelines && data.pipelines.length > 0 && (
            <CommandGroup heading="Воронки продаж">
              {data.pipelines.map((p) => (
                <CommandItem 
                  key={p.id} 
                  value={p.name}
                  onSelect={() => runCommand(() => router.push(`/pipelines/${p.id}`))}
                  className="cursor-pointer"
                >
                  <Briefcase className="mr-2 h-4 w-4 opacity-70" /> 
                  <span>{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data?.contacts && data.contacts.length > 0 && (
            <CommandGroup heading="Клиенты">
              {data.contacts.map((c) => {
                const displayName = `${c.firstName} ${c.lastName || ''}`.trim();
                return (
                  <CommandItem 
                    key={c.id} 
                    value={displayName}
                    onSelect={() => runCommand(() => router.push(`/contacts/${c.id}`))}
                    className="cursor-pointer"
                  >
                    <Users className="mr-2 h-4 w-4 opacity-70" /> 
                    <span>{displayName}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}