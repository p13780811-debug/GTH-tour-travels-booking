import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BLOCKED_AUTOMATION_AGENTS = [
  "python-requests",
  "selenium",
  "puppeteer",
] as const;

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() ?? "";

  if (
    userAgent &&
    BLOCKED_AUTOMATION_AGENTS.some((agent) => userAgent.includes(agent))
  ) {
    return new NextResponse("Access denied", { status: 403 });
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm)$).*)",
  ],
};
