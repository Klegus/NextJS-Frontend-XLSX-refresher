import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken, verifyCalendarToken } from '@/lib/msauth-server';
import { getAccessMode } from '@/lib/access';

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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: { ...CORS_HEADERS, 'Access-Control-Max-Age': '86400' } });
  }

  // Public mode: everything is open (lecturers' names are shortened server-side)
  if (getAccessMode() === 'public' || PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
    return withCors(NextResponse.next(), isApi);
  }

  // SSO mode from here on: a valid session is required for pages and API alike
  const session = request.cookies.get('auth-token')?.value;
  const user = session ? await verifyAuthToken(session) : null;
  if (user && user.scope !== 'calendar') {
    return withCors(NextResponse.next(), isApi);
  }

  // Calendar apps have no cookies - the subscription link carries a scoped token
  if (pathname.startsWith('/api/calendar/subscribe/')) {
    const token = request.nextUrl.searchParams.get('t');
    if (token && await verifyCalendarToken(token)) {
      return withCors(NextResponse.next(), isApi);
    }
  }

  if (isApi) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }
  const url = new URL('/login', request.url);
  url.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(url);
}

function withCors(response: NextResponse, isApi: boolean) {
  if (isApi) {
    for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
