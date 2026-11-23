import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/register')) return true;
  if (pathname.startsWith('/install')) return true;
  if (pathname.startsWith('/f/')) return true;           
  if (pathname.startsWith('/chat/')) return true;        
  if (pathname.startsWith('/api/auth')) return true;     
  if (pathname.startsWith('/api/public')) return true;   
  if (pathname.startsWith('/api/webhooks')) return true; 
  if (pathname === '/api/health') return true;           

  return false;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isPublic = isPublicPath(pathname);
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  if (isPublic) return NextResponse.next();

  if (!isLoggedIn) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|fonts|file\\.svg|globe\\.svg|next\\.svg|vercel\\.svg|window\\.svg|favicon\\.ico).*)',
    '/api/:path*',
  ],
};