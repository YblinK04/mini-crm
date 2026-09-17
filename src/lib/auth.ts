// src/lib/auth.ts
import NextAuth, { type Session, type User as NextAuthUser } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { LoginSchema } from '@/lib/schemas';
import { Role } from '@prisma/client';
import { type JWT } from 'next-auth/jwt';

const DUMMY_HASH = '$2a$10$AzR7G9pBYXzUhcS6K8UnbO5Z6KxN8Y6Q8YyGqK6v8z8z8z8z8z8z.';


const nodeAuthConfig = {
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      async authorize(credentials) {
        try {
          const validatedFields = LoginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.error(" [AUTH_VALIDATION_ERROR] Некорректные параметры запроса.");
            return null;
          }

          const { email, password } = validatedFields.data;
          const formattedEmail = email.toLowerCase().trim();

          const masterEmail = process.env.MASTER_ADMIN_EMAIL;
          const masterPassword = process.env.MASTER_ADMIN_PASSWORD;

          if (masterEmail && masterPassword && formattedEmail === masterEmail.toLowerCase().trim() && password === masterPassword) {
            console.log("👑 [AUTH_MASTER] Вход Главного Владельца из системного файла .env");

            let adminUser = await prisma.user.findUnique({
              where: { email: formattedEmail },
              select: { id: true, name: true, email: true, role: true, organizationId: true, isActive: true }
            });

            if (!adminUser) {
              console.log("🌱 [AUTH_SEED] Обнаружен первый запуск CRM. Атомарная инициализация локальной СУБД...");
              
              adminUser = await prisma.$transaction(async (tx) => {
                const defaultOrg = await tx.organization.create({
                  data: { name: "Наша Компания / Главный офис" }
                });

                const hashedAdminPassword = await hash(masterPassword, 10);

                return await tx.user.create({
                  data: {
                    email: formattedEmail,
                    password: hashedAdminPassword,
                    name: "Администратор (Владелец)",
                    role: "OWNER",
                    organizationId: defaultOrg.id,
                    isActive: true
                  },
                  select: { id: true, name: true, email: true, role: true, organizationId: true, isActive: true }
                });
              });
              console.log("✅ [AUTH_SEED_SUCCESS] Стартовая экосистема успешно развернута в локальном PostgreSQL!");
            }

            return {
              id: adminUser.id,
              name: adminUser.name,
              email: adminUser.email,
              role: adminUser.role as Role,
              organizationId: adminUser.organizationId,
              isActive: adminUser.isActive
            };
          }

          const user = await prisma.user.findUnique({
            where: { email: formattedEmail },
            select: { id: true, name: true, email: true, password: true, role: true, organizationId: true, isActive: true }
          });

          const passwordToCompare = user?.password ?? DUMMY_HASH;
          const passwordsMatch = await compare(password, passwordToCompare);

          if (!user || !passwordsMatch) {
            console.warn(` [AUTH_INVALID_ATTEMPT] Неудачный вход для аккаунта: ${formattedEmail}`);
            return null;
          }

          if (!user.isActive) {
            console.warn(` [AUTH_SUSPENDED_ACCESS] Деактивированный сотрудник попытался войти. ID: ${user.id}`);
            return null;
          }

          console.log(`✅ [AUTH_SUCCESS] УСПЕШНЫЙ ВХОД. Сотрудник: ${user.id}, Контекст филиала: ${user.organizationId}`);
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as Role,
            organizationId: user.organizationId,
            isActive: user.isActive
          };
        } catch (error) {
          console.error(" [AUTH_CRITICAL_EXCEPTION] Системный сбой в методе authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
 
    async jwt({ 
      token, 
      user, 
      trigger, 
      session 
    }: { 
      token: JWT; 
      user?: NextAuthUser | any; 
      trigger?: "signIn" | "signUp" | "update"; 
      session?: any; 
    }): Promise<JWT> {
      
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.isActive = user.isActive;
        token.name = user.name;
        token.updatedAt = Date.now();
        return token;
      }

      if (trigger === "update" && session?.name) {
        token.name = session.name as string;
        token.updatedAt = Date.now();
        return token;
      }

      if (token && token.id) {
        const fiveMinutesAgo = Date.now() - 300000;
        
        if (!token.updatedAt || token.updatedAt < fiveMinutesAgo) {
          try {
            const freshUser = await prisma.user.findUnique({
              where: { id: token.id },
              select: { isActive: true, role: true, name: true, organizationId: true }
            });

            if (!freshUser || !freshUser.isActive) {
              console.warn(` [AUTH_LIVE_KICK] Доступ к системе заблокирован рантаймом для ID: ${token.id}`);
              return {
                ...token,
                id: "",
                organizationId: "",
                isActive: false,
              };
            }

            token.role = freshUser.role;
            token.name = freshUser.name;
            token.organizationId = freshUser.organizationId;
            token.isActive = freshUser.isActive;
            token.updatedAt = Date.now();
          } catch (dbError) {
            console.error(" [AUTH_LIVE_SYNC_FAILED] Ошибка фоновой проверки сессии в PostgreSQL:", dbError);
          }
        }
      }

      return token;
    },

    async session({ 
      session, 
      token 
    }: { 
      session: Session; 
      token: JWT; 
    }): Promise<Session> {
      
      if (token && !token.isActive && session.user) {
        session.user.id = "";
        session.user.organizationId = "";
        session.user.isActive = false;
        return session;
      }

      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.isActive = token.isActive;
        session.user.name = token.name ?? "";
      }
      
      return session;
    }
  }
};

export const { 
  handlers, 
  auth, 
  signIn, 
  signOut,
  unstable_update: updateSession 
} = NextAuth(nodeAuthConfig);
