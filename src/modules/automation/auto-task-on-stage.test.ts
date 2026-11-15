import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockStageFindUnique,
  mockTaskCreate,
  handlerRef,
} = vi.hoisted(() => ({
  mockStageFindUnique: vi.fn(),
  mockTaskCreate: vi.fn(),
  handlerRef: {
    current: null as ((payload: any) => Promise<void>) | null,
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stage: { findUnique: mockStageFindUnique },
    task: { create: mockTaskCreate },
  },
}));

vi.mock('@/lib/events', () => ({
  events: {
    on: (eventName: string, handler: any) => {
      if (eventName === 'deal.stageChanged') handlerRef.current = handler;
      return () => {};
    },
  },
}));

import { registerAutoTaskOnStage } from './auto-task-on-stage';

describe('auto-task-on-stage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    handlerRef.current = null;
    delete (globalThis as { __autoTaskOnStageRegistered?: boolean })
      .__autoTaskOnStageRegistered;
    mockTaskCreate.mockResolvedValue({ id: 'task-1' });
  });

  function registerAndGetHandler() {
    registerAutoTaskOnStage();
    if (!handlerRef.current) throw new Error('Handler not registered');
    return handlerRef.current;
  }

  function makePayload(overrides: any = {}) {
    return {
      deal: {
        id: 'deal-1',
        title: 'Заявка',
        stageId: 'stage-2',
        organizationId: 'org-1',
      },
      oldStageId: 'stage-1',
      newStageId: 'stage-2',
      organizationId: 'org-1',
      userId: 'user-1',
      ...overrides,
    };
  }

  function stageWith(overrides: any = {}) {
    return {
      name: 'В работе',
      autoTaskTitle: 'Позвонить клиенту',
      autoTaskDays: 1,
      ...overrides,
    };
  }


  it('не создаёт если newStageId пустой', async () => {
    await registerAndGetHandler()(makePayload({ newStageId: '' }));
    expect(mockStageFindUnique).not.toHaveBeenCalled();
    expect(mockTaskCreate).not.toHaveBeenCalled();
  });

  it('не создаёт если oldStageId === newStageId (не настоящий переход)', async () => {
    await registerAndGetHandler()(
      makePayload({ oldStageId: 'stage-2', newStageId: 'stage-2' }),
    );
    expect(mockStageFindUnique).not.toHaveBeenCalled();
    expect(mockTaskCreate).not.toHaveBeenCalled();
  });

  it('не создаёт если этап не найден', async () => {
    mockStageFindUnique.mockResolvedValue(null);
    await registerAndGetHandler()(makePayload());
    expect(mockTaskCreate).not.toHaveBeenCalled();
  });

  it('не создаёт если autoTaskTitle = null', async () => {
    mockStageFindUnique.mockResolvedValue(
      stageWith({ autoTaskTitle: null }),
    );
    await registerAndGetHandler()(makePayload());
    expect(mockTaskCreate).not.toHaveBeenCalled();
  });

  it('не создаёт если autoTaskDays = null', async () => {
    mockStageFindUnique.mockResolvedValue(
      stageWith({ autoTaskDays: null }),
    );
    await registerAndGetHandler()(makePayload());
    expect(mockTaskCreate).not.toHaveBeenCalled();
  });

  it('не создаёт если userId пустой', async () => {
    mockStageFindUnique.mockResolvedValue(stageWith());
    await registerAndGetHandler()(makePayload({ userId: '' }));
    expect(mockTaskCreate).not.toHaveBeenCalled();
  });


  it('создаёт задачу с правильными полями', async () => {
    mockStageFindUnique.mockResolvedValue(stageWith());

    await registerAndGetHandler()(makePayload());

    expect(mockTaskCreate).toHaveBeenCalledOnce();
    const { data } = mockTaskCreate.mock.calls[0][0];
    expect(data).toMatchObject({
      organizationId: 'org-1',
      dealId: 'deal-1',
      title: 'Позвонить клиенту',
      createdById: 'user-1',
    });
    expect(data.description).toContain('В работе');
    expect(data.description).toContain('Заявка');
  });

  it('dueAt = now + autoTaskDays', async () => {
    mockStageFindUnique.mockResolvedValue(
      stageWith({ autoTaskDays: 3 }),
    );

    const before = Date.now();
    await registerAndGetHandler()(makePayload());
    const after = Date.now();

    const { data } = mockTaskCreate.mock.calls[0][0];
    const dueAt = (data.dueAt as Date).getTime();

    const expectedMin = before + 3 * 24 * 60 * 60 * 1000 - 5_000;
    const expectedMax = after + 3 * 24 * 60 * 60 * 1000 + 5_000;
    expect(dueAt).toBeGreaterThanOrEqual(expectedMin);
    expect(dueAt).toBeLessThanOrEqual(expectedMax);
  });

  it('autoTaskDays = 0 → dueAt ≈ now (сегодня)', async () => {
    mockStageFindUnique.mockResolvedValue(
      stageWith({ autoTaskDays: 0 }),
    );

    const before = Date.now();
    await registerAndGetHandler()(makePayload());
    const after = Date.now();

    const dueAt = (mockTaskCreate.mock.calls[0][0].data.dueAt as Date).getTime();
    expect(dueAt).toBeGreaterThanOrEqual(before);
    expect(dueAt).toBeLessThanOrEqual(after + 5_000);
  });

  it('autoTaskDays = 0 в 15:30 — не создаёт задачу в прошлом (10:00)', async () => {
    mockStageFindUnique.mockResolvedValue(
      stageWith({ autoTaskDays: 0 }),
    );

    const fakeNow = new Date('2026-11-12T15:30:00.000Z');
    vi.setSystemTime(fakeNow);

    await registerAndGetHandler()(makePayload());

    const dueAt = (mockTaskCreate.mock.calls[0][0].data.dueAt as Date).getTime();
    expect(dueAt).toBeGreaterThanOrEqual(fakeNow.getTime());

    vi.useRealTimers();
  });

  it('select запрашивает только нужные поля', async () => {
    mockStageFindUnique.mockResolvedValue(stageWith());

    await registerAndGetHandler()(makePayload());

    expect(mockStageFindUnique).toHaveBeenCalledWith({
      where: { id: 'stage-2' },
      select: {
        name: true,
        autoTaskTitle: true,
        autoTaskDays: true,
      },
    });
  });


  it('ошибка Prisma не ломает handler', async () => {
    mockStageFindUnique.mockRejectedValue(new Error('DB down'));

    await expect(
      registerAndGetHandler()(makePayload()),
    ).resolves.not.toThrow();
  });

  it('ошибка task.create не ломает handler', async () => {
    mockStageFindUnique.mockResolvedValue(stageWith());
    mockTaskCreate.mockRejectedValue(new Error('constraint'));

    await expect(
      registerAndGetHandler()(makePayload()),
    ).resolves.not.toThrow();
  });


  it('второй вызов registerAutoTaskOnStage не регистрирует второй handler', () => {
    registerAutoTaskOnStage();
    const firstHandler = handlerRef.current;

    handlerRef.current = null;
    registerAutoTaskOnStage();

    expect(handlerRef.current).toBeNull();
    expect(firstHandler).not.toBeNull();
  });
});