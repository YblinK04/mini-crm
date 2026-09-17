// src/app/api/auth/auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import { Role } from '@prisma/client';


declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    isActive: boolean;
    organizationId: string; 
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      isActive: boolean;
      organizationId: string; 
    } & import("next-auth").DefaultSession["user"];
  }
}


declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    isActive: boolean;
    organizationId: string; 
    updatedAt?: number;
  }
}

interface CustomSessionUpdate {
  name?: string;
}

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
   
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.isActive = user.isActive;
        token.name = user.name;
        token.updatedAt = token.updatedAt ?? Date.now();
      }

      if (trigger === "update" && session) {
        const updateData = session as CustomSessionUpdate;
        if (updateData.name) token.name = updateData.name;
      }
      return token;
    },


    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.isActive = token.isActive;
        session.user.name = token.name ?? "";
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, 
    updateAge: 24 * 60 * 60,   
  },
  secret: process.env.NEXTAUTH_SECRET
};
