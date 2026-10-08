
import type { TaskDTO } from "@/lib/schemas";


export type TaskJSON = Omit<
  TaskDTO,
  'dueAt' | 'completedAt' | 'createdAt' | 'updatedAt'
> & {
  dueAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deal?: { id: string; title: string; pipelineId: string } | null;
};
export interface TodayTasks {
  overdue: TaskJSON[];
  today: TaskJSON[];
  later: TaskJSON[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  dueAt: string;
  dealId?: string | null;
  contactId?: string | null;
  assignedToId?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  dueAt?: string;
  completedAt?: string | null;
  dealId?: string | null;
  contactId?: string | null;
  assignedToId?: string | null;
}


async function parseError(res: Response): Promise<string> {
  const raw: unknown = await res.json().catch(() => null);
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'error' in raw &&
    typeof (raw as { error: unknown }).error === 'string'
  ) {
    return (raw as { error: string }).error;
  }
  return `Ошибка ${res.status}`;
}

function assertTodayTasks(raw: unknown): asserts raw is TodayTasks {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Некорректный ответ сервера');
  }
  for (const key of ['overdue', 'today', 'later'] as const) {
    if (!Array.isArray((raw as Record<string, unknown>)[key])) {
      throw new Error(`Некорректный ответ сервера: отсутствует "${key}"`);
    }
  }
}


export async function fetchTodayTasks(): Promise<TodayTasks> {
  const res = await fetch('/api/tasks?view=today&daysAhead=1');
  if (!res.ok) throw new Error(await parseError(res));
  const raw: unknown = await res.json();
  assertTodayTasks(raw);
  return raw;
}

export async function fetchTasksByDeal(dealId: string): Promise<TaskJSON[]> {
  const res = await fetch(
    `/api/tasks?dealId=${encodeURIComponent(dealId)}`,
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchTasksByContact(
  contactId: string,
): Promise<TaskJSON[]> {
  const res = await fetch(
    `/api/tasks?contactId=${encodeURIComponent(contactId)}`,
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createTask(
  payload: CreateTaskPayload,
): Promise<TaskJSON> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateTask(
  id: string,
  payload: UpdateTaskPayload,
): Promise<TaskJSON> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
}