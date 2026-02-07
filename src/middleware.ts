import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit } from "@/lib/rate-limit";

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export async function middleware(req: NextRequest) {
  // Vercel uses HTTPS, so cookies have __Secure- prefix
  const isSecure = req.nextUrl.protocol === "https:";
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecure,
  });
  const isLoggedIn = !!token;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
                     req.nextUrl.pathname.startsWith("/register");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");

  // Allow auth API routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Apply rate limiting
  const ip = getClientIP(req);
  const rateLimitKey = isLoggedIn && token?.sub ? token.sub : ip;

  // Use stricter rate limit for auth pages (login/register)
  if (isAuthPage && !isLoggedIn) {
    const authRateLimit = await checkRateLimit(ip, "auth");
    if (!authRateLimit.success) {
      return new NextResponse("Too many login attempts. Please try again later.", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((authRateLimit.reset - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(authRateLimit.remaining),
          "X-RateLimit-Reset": String(authRateLimit.reset),
        },
      });
    }
  }

  // Apply general rate limiting
  const rateLimitType = isLoggedIn ? "authenticated" : "unauthenticated";
  const rateLimit = await checkRateLimit(rateLimitKey, rateLimitType);

  if (!rateLimit.success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.reset),
      },
    });
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect non-logged-in users to login
  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  response.headers.set("X-RateLimit-Reset", String(rateLimit.reset));
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
