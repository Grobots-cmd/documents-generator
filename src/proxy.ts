import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route protection proxy (Next.js 16 — replaces deprecated middleware.ts).
 * Uses next-auth getToken for proper JWT verification.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as string | undefined;

  // Not authenticated → redirect to login
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Coordinator + Admin only — MEMBERs see nothing here
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/generate") ||
    pathname.startsWith("/my-documents")
  ) {
    if (role !== "ADMIN" && role !== "COORDINATOR") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - api routes (including /api/auth/*)
     * - _next internals
     * - static assets
     * - public auth pages
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|login|register|.*\\.png$|.*\\.svg$).*)",
  ],
};
