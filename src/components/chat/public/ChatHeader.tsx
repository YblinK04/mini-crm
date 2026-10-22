'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { getInitials } from './utils';
import { useEffect, useState } from 'react';

interface ChatHeaderProps {
  organizationName: string;
}

export function ChatHeader({ organizationName }: ChatHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = getInitials(organizationName);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shrink-0 z-10">
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm font-semibold">
          {initials}
        </div>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" />
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
          {organizationName}
        </h1>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
          Отвечаем обычно в течение часа
        </p>
      </div>

      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Переключить тему"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      )}
    </header>
  );
}