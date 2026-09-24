import { NextRequest, NextResponse } from 'next/server';
import { createCalendarToken, verifyAuthToken } from '@/lib/msauth-server';
import { getAccessMode } from '@/lib/access';

// Signed link token for calendar subscriptions (SSO mode). Calendar apps can't
// send the session cookie, so the ICS URL carries this scoped token instead.
export async function GET(request: NextRequest) {
  if (getAccessMode() !== 'sso') {
    return NextResponse.json({ token: null });
  }
  const session = request.cookies.get('auth-token')?.value;
  const user = session ? await verifyAuthToken(session) : null;
  if (!user?.sub) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ token: await createCalendarToken(String(user.sub)) },
    { headers: { 'Cache-Control': 'no-store' } });
}
