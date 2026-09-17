import { auth } from "@/lib/auth"; 
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = nextUrl.pathname === "/"; 
  const isAuthRoute = nextUrl.pathname.startsWith("/login") || 
                      nextUrl.pathname.startsWith("/register");

  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    if (nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});


export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|fonts|file\\.svg|globe\\.svg|next\\.svg|vercel\\.svg|window\\.svg|favicon\\.ico).*)",
    "/api/:path*",
  ],
};
