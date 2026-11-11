import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  LeadSchema,
  CreateDealSchema,
  CreateTaskSchema,
  LoginSchema,
  CreatedUserSchema,
  UpdateEmailSettingsSchema,
  EmailTestActionSchema
} from './index';


function expectSuccess<T>(result: z.ZodSafeParseResult<T>): T {
  if (!result.success) {
    throw new Error(
      `Expected valid, got: ${JSON.stringify(result.error.flatten())}`,
    );
  }
  return result.data;
}


function expectFailure<T>(result: z.ZodSafeParseResult<T>): z.ZodError<T> {
  if (result.success) {
    throw new Error(
      `Expected invalid, got: ${JSON.stringify(result.data)}`,
    );
  }
  return result.error;
}



describe('LeadSchema (публичная заявка)', () => {
  const validLead = {
    slug: 'test',
    name: 'Иван',
    phone: '+7 999 123-45-67',
    email: 'ivan@example.com',
    message: 'Хочу заказать сайт',
    consent: true,
  };

  it('пропускает валидные данные', () => {
    expectSuccess(LeadSchema.safeParse(validLead));
  });

  it('пропускает без телефона и email', () => {
    expectSuccess(
      LeadSchema.safeParse({
        ...validLead,
        phone: null,
        email: null,
      }),
    );
  });

  it('превращает пустой email в null (preprocess)', () => {
    const data = expectSuccess(
      LeadSchema.safeParse({ ...validLead, email: '' }),
    );
    expect(data.email).toBe(null);
  });

  it('превращает email из одних пробелов в null', () => {
    const data = expectSuccess(
      LeadSchema.safeParse({ ...validLead, email: '   ' }),
    );
    expect(data.email).toBe(null);
  });

  it('обрезает пробелы в name и message', () => {
    const data = expectSuccess(
      LeadSchema.safeParse({
        ...validLead,
        name: '  Иван  ',
        message: '  Хочу сайт  ',
      }),
    );
    expect(data.name).toBe('Иван');
    expect(data.message).toBe('Хочу сайт');
  });

  it('отклоняет без согласия (false)', () => {
    expectFailure(LeadSchema.safeParse({ ...validLead, consent: false }));
  });

  it('отклоняет без согласия (undefined) — ошибка именно по полю consent', () => {
    const { consent: _consent, ...rest } = validLead;
    const error = expectFailure(LeadSchema.safeParse(rest));
    expect(
      error.issues.some((i) => i.path[0] === 'consent'),
    ).toBe(true);
  });

  it.each(['name', 'message'] as const)(
    'отклоняет пустое поле %s',
    (field) => {
      expectFailure(
        LeadSchema.safeParse({ ...validLead, [field]: '' }),
      );
    },
  );

  it.each(['name', 'message'] as const)(
    'отклоняет поле %s из одних пробелов (trim → пусто)',
    (field) => {
      expectFailure(
        LeadSchema.safeParse({ ...validLead, [field]: '   ' }),
      );
    },
  );

  it('отклоняет невалидный email', () => {
    expectFailure(
      LeadSchema.safeParse({ ...validLead, email: 'not-email' }),
    );
  });

  it.each([
    ['пустой', ''],
    ['с пробелом', 'test space'],
    ['с подчёркиванием', 'test_slug'],
    ['с юникодом', 'тест'],
    ['длиной >64', 'a'.repeat(65)],
  ])('отклоняет slug: %s', (_label, slug) => {
    expectFailure(LeadSchema.safeParse({ ...validLead, slug }));
  });

  it('отклоняет name длиной >100', () => {
    expectFailure(
      LeadSchema.safeParse({ ...validLead, name: 'а'.repeat(101) }),
    );
  });

  it('отклоняет message длиной >4000', () => {
    expectFailure(
      LeadSchema.safeParse({ ...validLead, message: 'а'.repeat(4001) }),
    );
  });
});

describe('CreateDealSchema', () => {
  const validDeal = {
    title: 'Сайт для Иванова',
    description: 'Описание',
    budget: '50000',
    priority: 'MEDIUM' as const,
    pipelineId: 'clx1234567890abcdefghijk',
    stageId: 'clx1234567890abcdefghijk',
    companyId: null,
    contactIds: [] as string[],
    customFields: [{ key: 'Город', value: 'Москва' }],
  };

  it('пропускает валидные данные', () => {
    expectSuccess(CreateDealSchema.safeParse(validDeal));
  });

  it('превращает строку бюджета в число 50000', () => {
    const data = expectSuccess(CreateDealSchema.safeParse(validDeal));
    expect(data.budget).toBe(50000);
    expect(typeof data.budget).toBe('number');
  });

  it('пустой бюджет → 0', () => {
    const data = expectSuccess(
      CreateDealSchema.safeParse({ ...validDeal, budget: '' }),
    );
    expect(data.budget).toBe(0);
  });

  it('округляет дробный бюджет (123.7 → 124)', () => {
    const data = expectSuccess(
      CreateDealSchema.safeParse({ ...validDeal, budget: '123.7' }),
    );
    expect(data.budget).toBe(124);
  });

  it('превращает массив customFields в Record', () => {
    const data = expectSuccess(CreateDealSchema.safeParse(validDeal));
    expect(data.customFields).toEqual({ Город: 'Москва' });
  });

  it('customFields: [] → {}', () => {
    const data = expectSuccess(
      CreateDealSchema.safeParse({ ...validDeal, customFields: [] }),
    );
    expect(data.customFields).toEqual({});
  });

  it('customFields с дублирующимся ключом: остаётся последнее значение', () => {
    const data = expectSuccess(
      CreateDealSchema.safeParse({
        ...validDeal,
        customFields: [
          { key: 'A', value: '1' },
          { key: 'A', value: '2' },
        ],
      }),
    );
    expect(data.customFields).toEqual({ A: '2' });
  });

  it('отклоняет пустой title', () => {
    expectFailure(
      CreateDealSchema.safeParse({ ...validDeal, title: '' }),
    );
  });

  it('отклоняет title из одних пробелов', () => {
    expectFailure(
      CreateDealSchema.safeParse({ ...validDeal, title: '   ' }),
    );
  });

  it.each([
    ['pipelineId', 'not-a-cuid'],
    ['stageId', 'not-a-cuid'],
  ] as const)('отклоняет невалидный %s', (field, value) => {
    expectFailure(
      CreateDealSchema.safeParse({ ...validDeal, [field]: value }),
    );
  });
});


describe('CreateTaskSchema', () => {
  it('пропускает валидные данные', () => {
    expectSuccess(
      CreateTaskSchema.safeParse({
        title: 'Позвонить клиенту',
        description: null,
        dueAt: new Date().toISOString(),
        dealId: null,
        contactId: null,
        assignedToId: null,
      }),
    );
  });

  it('отклоняет пустой title', () => {
    expectFailure(
      CreateTaskSchema.safeParse({
        title: '',
        dueAt: new Date().toISOString(),
      }),
    );
  });

  it('отклоняет title из одних пробелов', () => {
    expectFailure(
      CreateTaskSchema.safeParse({
        title: '   ',
        dueAt: new Date().toISOString(),
      }),
    );
  });

  it('отклоняет невалидный dueAt', () => {
    expectFailure(
      CreateTaskSchema.safeParse({
        title: 'Позвонить',
        dueAt: 'not-a-date',
      }),
    );
  });
});


describe('LoginSchema', () => {
  it('пропускает валидные данные', () => {
    expectSuccess(
      LoginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        rememberMe: true,
      }),
    );
  });

  it('приводит email к нижнему регистру', () => {
    const data = expectSuccess(
      LoginSchema.safeParse({
        email: 'User@Example.COM',
        password: 'password123',
        rememberMe: false,
      }),
    );
    expect(data.email).toBe('user@example.com');
  });

  it('обрезает пробелы вокруг email', () => {
    const data = expectSuccess(
      LoginSchema.safeParse({
        email: '  user@example.com  ',
        password: 'password123',
      }),
    );
    expect(data.email).toBe('user@example.com');
  });

  it('отклоняет невалидный email', () => {
    expectFailure(
      LoginSchema.safeParse({
        email: 'not-email',
        password: 'password123',
      }),
    );
  });

  it('отклоняет пустой пароль', () => {
    expectFailure(
      LoginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      }),
    );
  });
});


describe('CreatedUserSchema', () => {
  const validUser = {
    name: 'Иван',
    email: 'ivan@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    organizationName: 'Моя компания',
  };

  it('пропускает валидные данные', () => {
    expectSuccess(CreatedUserSchema.safeParse(validUser));
  });

  it('отклоняет несовпадающие пароли', () => {
    expectFailure(
      CreatedUserSchema.safeParse({
        ...validUser,
        confirmPassword: 'different123',
      }),
    );
  });

  it('отклоняет короткий пароль', () => {
    expectFailure(
      CreatedUserSchema.safeParse({
        ...validUser,
        password: '123',
        confirmPassword: '123',
      }),
    );
  });

  it('отклоняет невалидный email', () => {
    expectFailure(
      CreatedUserSchema.safeParse({
        ...validUser,
        email: 'not-email',
      }),
    );
  });

  it('отклоняет name из одних пробелов', () => {
    expectFailure(
      CreatedUserSchema.safeParse({
        ...validUser,
        name: '   ',
      }),
    );
  });

  it('отклоняет пустой organizationName', () => {
    expectFailure(
      CreatedUserSchema.safeParse({
        ...validUser,
        organizationName: '',
      }),
    );
  });

  it('пароль длиной 200 символов проходит (если схема не ограничивает)', () => {
    const long = 'a'.repeat(200);
    const result = CreatedUserSchema.safeParse({
      ...validUser,
      password: long,
      confirmPassword: long,
    });
    expect(result).toBeDefined();
  });
});

describe('UpdateEmailSettingsSchema', () => {
  it('пропускает частичное обновление', () => {
    expect(UpdateEmailSettingsSchema.safeParse({ smtpHost: 'smtp.yandex.ru' }).success).toBe(true);
  });
  it('отклоняет невалидный порт', () => {
    expect(UpdateEmailSettingsSchema.safeParse({ smtpPort: 0 }).success).toBe(false);
    expect(UpdateEmailSettingsSchema.safeParse({ smtpPort: 70000 }).success).toBe(false);
  });
  it('принимает пустой ownerEmail', () => {
    expect(UpdateEmailSettingsSchema.safeParse({ ownerEmail: '' }).success).toBe(true);
  });
  it('отклоняет невалидный ownerEmail', () => {
    expect(UpdateEmailSettingsSchema.safeParse({ ownerEmail: 'not-email' }).success).toBe(false);
  });
});

describe('EmailTestActionSchema', () => {
  it.each(['test-connection', 'send-test'])('принимает action=%s', (action) => {
    expect(EmailTestActionSchema.safeParse({ action }).success).toBe(true);
  });
  it('отклоняет неизвестный action', () => {
    expect(EmailTestActionSchema.safeParse({ action: 'hack' }).success).toBe(false);
  });
});