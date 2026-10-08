import { z } from 'zod';


export const UserRoleEnum = z.enum(["OWNER", "ADMIN", "MANAGER"]);
export const DealPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const ActivityTypeEnum = z.enum(['NOTE', 'SYSTEM_STAGE', 'SYSTEM_BUDGET', 'SYSTEM_TASK']);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional();

const PHONE_REGEX = /^\+?[\d\s\-\(\)]{7,20}$/;


const HEX_COLOR_REGEX = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;


export const UserSchema = z.object({
  id: z.string().cuid(), 
  email: z.string().trim().toLowerCase().email("Неверный формат почты").max(255),
  name: z.string().trim().min(2, "Имя слишком короткое").max(100),
  role: UserRoleEnum,
  image: z.string().url("Некорректная ссылка на аватар").max(2048).optional().nullable(),
  organizationId: z.string().cuid("Некорректный ID организации"),   
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreatedUserSchema = z.object({
  name: z.string().trim().min(2, "Имя должно содержать минимум 2 символа").max(100),
  email: z.string().trim().toLowerCase().email("Введите корректный email").max(255),
  password: z.string()
    .min(8, "Пароль должен быть не менее 8 символов")
    .max(72, "Пароль слишком длинный")
    .regex(/[a-zA-Z]/, "Пароль должен содержать латинские буквы")
    .regex(/\d/, "Пароль должен содержать хотя бы одну цифру"),
  confirmPassword: z.string().min(1, "Пожалуйста, подтвердите пароль"),
  organizationName: z.string().trim().min(2, "Название компании должно быть не менее 2 символов").max(100), 
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Пароли не совпадают',
      path: ['confirmPassword'], 
    });
  }
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Неверный формат почты").max(255),
  password: z.string().min(1, 'Пароль обязателен для заполнения').max(100),
  rememberMe: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
});

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, "Имя слишком короткое").max(100),
});



export const PipelineSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1, 'Название воронки обязательно').max(100),
  organizationId: z.string().cuid("Некорректный ID организации"),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const CreatePipelineSchema = z.object({
  name: z.string().trim().min(1, 'Название воронки обязательно').max(100),
});

export const StageSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1, 'Название этапа обязательно').max(100),
  color: z.string().regex(HEX_COLOR_REGEX, "Некорректный HEX-цвет").default('#3b82f6'),
  order: z.number().int().nonnegative().default(0),
  pipelineId: z.string().cuid(),
});


export const CompanySchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1, 'Название компании обязательно').max(100),
  organizationId: z.string().cuid("Некорректный ID организации"),
});

export const CreateCompanySchema = z.object({
  name: z.string().trim().min(1, 'Название компании обязательно').max(100),
});

export const ContactSchema = z.object({
  id: z.string().cuid(),
  firstName: z.string().trim().min(1, 'Имя обязательно для заполнения').max(50),
  lastName: z.string().trim().max(50).optional().nullable(),
  phone: z.string().trim().regex(PHONE_REGEX, "Неверный формат телефона").max(50).optional().nullable(),
  email: z.union([
    z.string().trim().toLowerCase().email("Неверный формат почты").max(255), 
    z.literal('')
  ]).optional().nullable(),
  socialLink: z.union([
    z.string().trim().url("Введите корректную ссылку").max(2048), 
    z.literal('')
  ]).optional().nullable(),
  companyId: z.string().cuid().optional().nullable(),
  organizationId: z.string().cuid("Некорректный ID организации"),
  customFields: z.record(z.string(), z.string().max(500)).optional().nullable(), 
});

export const CreateContactSchema = ContactSchema.omit({ id: true, organizationId: true }).superRefine((data, ctx) => {
  if (!data.phone && !data.email && !data.socialLink) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Укажите хотя бы один способ связи (Телефон, Email или Ссылку)',
      path: ['phone'],
    });
  }
});

export const DealSchema = z.object({
  id: z.string().cuid(),
  title: z.string().trim().min(1, 'Название сделки обязательно').max(200),
  description: z.string().trim().max(3000, "Описание не должно превышать 3000 символов").optional().nullable(),
  
  budget: z.number().int("Бюджет должен быть целым числом в копейках").nonnegative("Бюджет не может быть отрицательным").max(100000000000).default(0),
  
  priority: DealPriorityEnum.default('MEDIUM'),
  order: z.number().int().nonnegative().default(0),
  closeDate: z.coerce.date().optional().nullable(),
  pipelineId: z.string().cuid(),
  stageId: z.string().cuid(),
  assigneeId: z.string().cuid().optional().nullable(),
  companyId: z.string().cuid().optional().nullable(),
  organizationId: z.string().cuid(),
  
  customFields: z.record(z.string(), z.string().max(500)).optional().nullable(), 
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateDealSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Название сделки обязательно')
    .max(200, 'Название слишком длинное'),
  
  description: z
    .string()
    .trim()
    .max(3000, 'Описание слишком длинное')
    .optional()
    .nullable(),
  
  budget: z.union([z.number(), z.string()])
    .transform((val) => {
      if (val === '' || val === undefined || val === null) return 0;
      const parsed = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(parsed) ? 0 : Math.round(parsed);
    }),
  
  priority: DealPriorityEnum.default('MEDIUM'),
  pipelineId: z.string().cuid('Некорректный формат ID воронки'),
  stageId: z.string().cuid('Некорректный формат ID этапа'),
  companyId: z.string().cuid().optional().nullable(),
  
  contactIds: z
    .array(z.string().cuid())
    .max(30, "Нельзя привязать более 30 контактов одновременно")
    .optional()
    .default([]),

  customFields: z
    .array(
      z.object({
        key: z.string().trim(),
        value: z.string().trim(),
      })
    )
    .default([])
    .transform((arr) => {
      const obj: Record<string, string> = {};
      arr.forEach((item) => {
        if (item.key) obj[item.key] = item.value;
      });
      return obj;
    }),
});

export const UpdateDealSchema = CreateDealSchema.partial().extend({
  id: z.string().cuid('Некорректный формат ID сделки'),
});

export const MoveDealSchema = z.object({
  dealId: z.string().cuid('Некорректный формат ID сделки'),
  newStageId: z.string().cuid('Некорректный формат ID этапа'), 
  newOrder: z.number().int().nonnegative(),
  pipelineId: z.string().cuid('Некорректный формат ID воронки'),
});



export const ActivityLogSchema = z.object({
  id: z.string().cuid(),
  content: z.string().trim().min(1, 'Заметка не может быть пустой').max(4000, "Заметка слишком длинная"),
  type: ActivityTypeEnum,
  dealId: z.string().cuid(),
  authorId: z.string().cuid(),
  createdAt: z.date(),
});

export const CreateActivityNoteSchema = z.object({
  content: z.string().trim().min(1, 'Заметка не может быть пустой').max(4000),
  dealId: z.string().cuid(),
});

export const CreateDealApiSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(3000).optional().nullable(),
  budget: z.number().int().nonnegative().max(100_000_000_000).default(0),
  priority: DealPriorityEnum.default('MEDIUM'),
  pipelineId: z.string().cuid(),
  stageId: z.string().cuid(),
  companyId: z.string().cuid().optional().nullable(),
  contactIds: z.array(z.string().cuid()).max(30).default([]),
  customFields: z.record(z.string(), z.string().max(500)).default({}),
});

export const TaskSchema = z.object({
  id: z.string().cuid(),
  organizationId: z.string().cuid(),
  title: z.string(),
  description: z.string().nullable(),
  dueAt: z.date(),
  completedAt: z.date().nullable(),
  dealId: z.string().cuid().nullable(),
  contactId: z.string().cuid().nullable(),
  createdById: z.string().cuid(),
  assignedToId: z.string().cuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Название задачи обязательно').max(200),
  description: optionalText(2000),
  dueAt: z.coerce.date(),
  dealId: z.string().cuid().nullable().optional(),
  contactId: z.string().cuid().nullable().optional(),
  assignedToId: z.string().cuid().nullable().optional(),
});


export const UpdateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: optionalText(2000),
    dueAt: z.coerce.date().optional(),
    completedAt: z.coerce.date().nullable().optional(),
    dealId: z.string().cuid().nullable().optional(),
    contactId: z.string().cuid().nullable().optional(),
    assignedToId: z.string().cuid().nullable().optional(),
  })
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    { message: 'Укажите хотя бы одно поле для обновления' },
  );


export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreatedUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export type Pipeline = z.infer<typeof PipelineSchema>;
export type CreatePipelineInput = z.infer<typeof CreatePipelineSchema>;
export type Stage = z.infer<typeof StageSchema>;

export type Company = z.infer<typeof CompanySchema>;
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type UpdateContactInput = z.infer<typeof ContactSchema>;

export type Deal = z.infer<typeof DealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
export type MoveDealInput = z.infer<typeof MoveDealSchema>;

export type ActivityLog = z.infer<typeof ActivityLogSchema>;
export type CreateActivityNoteInput = z.infer<typeof CreateActivityNoteSchema>;
export type CreateDealInput = z.input<typeof CreateDealSchema>
export type CreateDealOutput = z.infer<typeof CreateDealSchema>;
export type CreateDealApiInput = z.infer<typeof CreateDealApiSchema>;
export type TaskDTO = z.infer<typeof TaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;