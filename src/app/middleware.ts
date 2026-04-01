// Location: /src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // ✅ FIX: Safely get IP without using non-existent 'request.ip'
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',') : '127.0.0.1';
  const ua = request.headers.get('user-agent') || '';

  // 🛡️ POINT 1 & 3: Anti-Hack & Bot Protection
  const blacklistedBots = ['python-requests', 'curl', 'headless', 'selenium', 'puppeteer'];
  if (blacklistedBots.some(bot => ua.toLowerCase().includes(bot))) {
    return new NextResponse('GTH-PRO Security: Access Denied', { status: 403 });
  }

  const response = NextResponse.next();

  // ✅ POINT 8: Mandatory Security Layers (Never Delete These)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}