import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit } from "@/lib/rate-limit";

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (real) {
    return real;
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

  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimitKey = isLoggedIn ? (token.sub as string) : clientIP;
  const rateLimitType = isLoggedIn ? "authenticated" : "unauthenticated";

  // Check general rate limit
  const rateLimitResult = await checkRateLimit(rateLimitKey, rateLimitType);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitType === "authenticated" ? "100" : "20",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          "Retry-After": "60",
        },
      }
    );
  }

  // Apply stricter auth rate limit for login/register pages
  if (isAuthPage && !isLoggedIn) {
    const authRateLimitResult = await checkRateLimit(clientIP, "auth");
    if (!authRateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many authentication attempts" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": authRateLimitResult.reset.toString(),
            "Retry-After": "60",
          },
        }
      );
    }
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
  const limit = rateLimitType === "authenticated" ? "100" : "20";
  response.headers.set("X-RateLimit-Limit", limit);
  response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
  response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
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
