import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { isRateLimited } from "@/lib/rate-limit";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const protectedRoutes = [
  "/history",
  "/profile",
  "/settings",
  "/my-cvs",
  "/create-cv",
];

const protectedApiRoutes = [
  "/api/import-cv",
  "/api/chat",
  "/api/find-jobs",
  "/api/analyze-job",
  "/api/history",
  "/api/user",
  "/api/optimize",
  "/api/cover-letter",
  "/api/skill-gap",
  "/api/re-enhance",
  "/api/enhance-cv-content",
  "/api/generate-summary",
  "/api/compare-jobs",
  "/api/interview",
  "/api/linkedin",
  "/api/save-cv",
  "/api/my-cvs",
  "/api/dashboard/stats",
  "/api/job-alerts",
  "/api/notifications",
  "/api/share-cv",
];

const aiApiPrefixes = [
  "/api/import-cv",
  "/api/chat",
  "/api/optimize",
  "/api/cover-letter",
  "/api/skill-gap",
  "/api/re-enhance",
  "/api/enhance-cv-content",
  "/api/generate-summary",
  "/api/compare-jobs",
  "/api/interview/generate",
  "/api/interview/evaluate",
  "/api/linkedin/parse",
  "/api/linkedin/merge",
  "/api/find-jobs",
  "/api/analyze-job",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Authentication attempts are limited before password hashing or email delivery.
  if (pathname.startsWith("/api/auth/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(`auth:${ip}`, 10)) {
      return NextResponse.json(
        { success: false, error: "Çok fazla deneme yaptınız. Lütfen biraz bekleyin." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    return NextResponse.next();
  }

  const isAiRoute = aiApiPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Auth kontrolü
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApi = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || !payload.userId) throw new Error("Invalid session");
    if (isAiRoute && isRateLimited(`ai:${payload.userId}`, 15)) {
      return NextResponse.json(
        { success: false, error: "Çok fazla istek gönderdiniz. Lütfen biraz bekleyin." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    return NextResponse.next();
  } catch {
    const response = isProtectedApi
      ? NextResponse.json(
          { success: false, error: "Oturum süresi dolmuş" },
          { status: 401 }
        )
      : NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: [
    "/api/import-cv/:path*",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/chat/:path*",
    "/history/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/my-cvs/:path*",
    "/create-cv/:path*",
    "/api/history/:path*",
    "/api/user/:path*",
    "/api/optimize/:path*",
    "/api/cover-letter/:path*",
    "/api/skill-gap/:path*",
    "/api/re-enhance/:path*",
    "/api/enhance-cv-content/:path*",
    "/api/generate-summary/:path*",
    "/api/compare-jobs/:path*",
    "/api/interview/:path*",
    "/api/linkedin/:path*",
    "/api/save-cv/:path*",
    "/api/my-cvs/:path*",
    "/api/dashboard/:path*",
    "/api/find-jobs/:path*",
    "/api/analyze-job/:path*",
    "/api/job-alerts/:path*",
    "/api/notifications/:path*",
    "/api/share-cv/:path*",
  ],
};
