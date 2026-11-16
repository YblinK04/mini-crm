import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);

export function isOwnerOrAdmin(session: Session | null): boolean {
  if (!session?.user?.organizationId) return false;
  return ADMIN_ROLES.has(session.user.role ?? '');
}

export function isOwner(session: Session | null): boolean {
  return session?.user?.role === 'OWNER';
}

export function requireAuth(session: Session | null): NextResponse | null {
  if (!session?.user?.id || !session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function requireOwnerOrAdmin(
  session: Session | null,
): NextResponse | null {
  const denied = requireAuth(session);
  if (denied) return denied;
  if (!isOwnerOrAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export function requireOwner(session: Session | null): NextResponse | null {
  const denied = requireAuth(session);
  if (denied) return denied;
  if (!isOwner(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}