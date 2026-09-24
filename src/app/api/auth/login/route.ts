import { NextRequest, NextResponse } from 'next/server';
import {
  OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, SERVER_REDIRECT_URI, publicUrl,
  oauthEndpoint, pkceChallenge, randomUrlSafe,
} from '@/lib/msauth-server';

// Starts the Microsoft sign-in: generates state + PKCE on the server, keeps them
// in httpOnly cookies and redirects to the authorize endpoint. The callback
// only accepts a response whose state matches the cookie (login CSRF protection).
export async function GET(request: NextRequest) {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  let authorizeUrl: string;
  try {
    if (!clientId) throw new Error('Azure AD Client ID not configured');
    authorizeUrl = oauthEndpoint('authorize');
  } catch (error: any) {
    return NextResponse.redirect(publicUrl(`/login?error=${encodeURIComponent(error.message)}`));
  }

  const state = randomUrlSafe();
  const verifier = randomUrlSafe(48);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: SERVER_REDIRECT_URI,
    response_mode: 'query',
    scope: 'openid profile email User.Read',
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256',
  });

  const response = NextResponse.redirect(`${authorizeUrl}?${params.toString()}`);
  const cookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !SERVER_REDIRECT_URI.startsWith('http://'),
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: 10 * 60,
  };
  response.cookies.set({ name: OAUTH_STATE_COOKIE, value: state, ...cookie });
  response.cookies.set({ name: OAUTH_VERIFIER_COOKIE, value: verifier, ...cookie });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
