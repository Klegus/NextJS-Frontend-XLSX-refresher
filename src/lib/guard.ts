import { NextResponse } from 'next/server';
import { getAccessMode } from './access';
import { verifyAuthToken, verifyCalendarToken } from './msauth-server';

function cookieValue(request: Request, name: string): string | undefined {
  const match = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1];
}

// Second line of defence behind the middleware: every API route handler checks
// access itself, so a middleware bypass (e.g. CVE-2025-29927) exposes nothing.
// Returns a 401 response to send, or null when the request may proceed.
export async function denyWithoutAccess(
  request: Request,
  { allowCalendarToken = false } = {},
): Promise<NextResponse | null> {
  if (getAccessMode() === 'public') return null;
  const session = cookieValue(request, 'auth-token');
  if (session && await verifyAuthToken(session)) return null;
  if (allowCalendarToken) {
    const token = new URL(request.url).searchParams.get('t');
    if (token && await verifyCalendarToken(token)) return null;
  }
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
