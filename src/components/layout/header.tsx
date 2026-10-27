'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { SearchCommand } from './search-command';
import { NotificationsPopover } from './notifications-popover';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Role } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User, Menu, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
    isActive: boolean;
    organizationId: string;
  };
}

export function Header({ user }: HeaderProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const openMobileMenu = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      setIsSigningOut(false); 
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/50 backdrop-blur-md px-3 md:px-6 sticky top-0 z-40 w-full gap-2 md:gap-4">
      
      <div className="flex-1 flex items-center min-w-0 gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 -ml-2"
          onClick={openMobileMenu}
          aria-label="Открыть навигационное меню"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="w-full max-w-md min-w-0">
          <SearchCommand />
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        <NotificationsPopover />
        <ModeToggle />

        <div className="h-6 w-[1px] bg-border mx-0.5 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              type="button"
              variant="ghost" 
              className="relative h-9 w-9 rounded-full border border-border/50 shadow-sm"
              aria-label="Меню профиля"
              title="Профиль"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.image || ''} alt={user.name || 'Профиль'} />
                <AvatarFallback className="text-[10px] bg-primary/5 text-primary">
                  {user.name?.[0] || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold truncate text-foreground">
                  {user.name || 'Сотрудник'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex w-full items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Настройки
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer focus:bg-destructive/10 focus:text-destructive"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              {isSigningOut ? 'Выходим...' : 'Выйти'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}