import { NextResponse } from 'next/server';
import { publicUrl } from '@/lib/msauth-server';

// The session cookie is httpOnly, so it can only be cleared by the server
export async function GET() {
  const response = NextResponse.redirect(publicUrl('/login'));
  response.cookies.set({ name: 'auth-token', value: '', path: '/', maxAge: 0, httpOnly: true });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const POST = GET;
