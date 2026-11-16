'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateUserDialog } from './create-user-dialog';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'OWNER' | 'ADMIN' | 'MANAGER';
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABEL: Record<UserRow['role'], string> = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
};

export function UsersList({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery<UserRow[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Не удалось загрузить пользователей');
      return res.json();
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Ошибка');
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(vars.isActive ? 'Доступ восстановлен' : 'Доступ закрыт');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Загрузка...
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="text-sm text-destructive">
        Не удалось загрузить пользователей
      </div>
    );
  }

  const users = query.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Всего: {users.length}
        </p>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Добавить менеджера
        </Button>
      </div>

      <div className="border rounded-2xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.name ?? '—'}
                    {isSelf && (
                      <span className="text-[10px] text-muted-foreground ml-2">
                        (это вы)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === 'OWNER' ? 'default' : 'secondary'}
                    >
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Badge
                        variant="outline"
                        className="text-emerald-600 border-emerald-500/30"
                      >
                        Активен
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-red-600 border-red-500/30"
                      >
                        Отключён
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isSelf && u.role !== 'OWNER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleActive.mutate({
                            id: u.id,
                            isActive: !u.isActive,
                          })
                        }
                        disabled={toggleActive.isPending}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-1.5" />
                            Отключить
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1.5" />
                            Включить
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}