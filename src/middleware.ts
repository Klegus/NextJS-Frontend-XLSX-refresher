import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken, verifyCalendarToken } from '@/lib/msauth-server';
import { getAccessMode } from '@/lib/access';
import { getClientIp } from '@/lib/clientIp';

// Always reachable, also in SSO mode: sign-in itself, maintenance status and
// the files search engines / link previews need
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/',
  '/api/status',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
  '/opengraph-image',
  '/icon',
  '/favicon.ico',
];

// Per-address request limit for the API (fixed one-minute window, per server
// instance). Protects the backend and the university platform from floods;
// a CDN/proxy limit can sit in front of it as well.
const API_LIMIT_PER_MINUTE = Number(process.env.API_RATE_LIMIT_PER_MINUTE || 120);
const hits = new Map<string, { windowStart: number; count: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.windowStart >= 60_000) {
    if (hits.size > 10_000) hits.clear();  // bound memory under a spread-out flood
    hits.set(key, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > API_LIMIT_PER_MINUTE;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // Without a trusted client address every visitor would share one bucket, so
  // the limit applies only behind a proxy that reports the address
  const clientIp = isApi ? getClientIp(request) : '';
  if (clientIp && rateLimited(clientIp)) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  // Public mode: everything is open (lecturers' names are shortened server-side)
  if (getAccessMode() === 'public' || PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // SSO mode from here on: a valid session is required for pages and API alike
  // (API route handlers check it again - see lib/guard.ts)
  const session = request.cookies.get('auth-token')?.value;
  if (session && await verifyAuthToken(session)) {
    return NextResponse.next();
  }

  // Calendar apps have no cookies - the subscription link carries a scoped token
  if (pathname.startsWith('/api/calendar/subscribe/')) {
    const token = request.nextUrl.searchParams.get('t');
    if (token && await verifyCalendarToken(token)) {
      return NextResponse.next();
    }
  }

  if (isApi) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL('/login', request.url);
  url.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
