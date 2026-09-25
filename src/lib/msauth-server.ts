import { jwtVerify, SignJWT } from 'jose';
import { getSiteUrl } from './access';

// Secret used to sign session tokens. There is deliberately no fallback: a
// known default would let anyone forge a session.
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET is not set (min. 16 characters)');
  }
  return new TextEncoder().encode(secret);
}

// Every token names its issuer and purpose (audience); verification pins the
// algorithm, so a calendar token can never pass as a session and vice versa
const ISSUER = 'wspa-plan';
const SESSION_AUDIENCE = 'session';
const CALENDAR_AUDIENCE = 'calendar';

async function verify(token: string, audience: string) {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ['HS256'], issuer: ISSUER, audience,
  });
  return payload;
}

// Session token check (middleware and API route handlers)
export async function verifyAuthToken(token: string): Promise<any> {
  try {
    return await verify(token, SESSION_AUDIENCE);
  } catch {
    return null;
  }
}

// Tworzenie tokenu JWT po pomyślnym uwierzytelnieniu
export async function createAuthToken(userData: any): Promise<string> {
  const secret = getJwtSecret();

  return new SignJWT({
    sub: userData.id,
    name: userData.name,
    email: userData.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

// Calendar apps (Google, Apple, Outlook) fetch the ICS feed without cookies, so
// in SSO mode the subscription link carries its own signed, scoped token
export async function createCalendarToken(userId: string): Promise<string> {
  return new SignJWT({ scope: 'calendar' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(CALENDAR_AUDIENCE)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('365d')
    .sign(getJwtSecret());
}

export async function verifyCalendarToken(token: string): Promise<boolean> {
  try {
    const payload = await verify(token, CALENDAR_AUDIENCE);
    return payload.scope === 'calendar';
  } catch {
    return false;
  }
}

export const MICROSOFT_OAUTH_URL = 'https://login.microsoftonline.com';

export function oauthEndpoint(kind: 'authorize' | 'token'): string {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  if (!tenantId) throw new Error('Azure AD Tenant ID not configured');
  return `${MICROSOFT_OAUTH_URL}/${tenantId}/oauth2/v2.0/${kind}`;
}

// Short-lived cookies holding the OAuth state and PKCE verifier between
// /api/auth/login and /api/auth/callback
export const OAUTH_STATE_COOKIE = 'oauth-state';
export const OAUTH_VERIFIER_COOKIE = 'oauth-verifier';

export function randomUrlSafe(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Buffer.from(buf).toString('base64url');
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return Buffer.from(digest).toString('base64url');
}


// OAuth redirect registered in Entra ID: always SITE_URL + /api/auth/callback
export const SERVER_REDIRECT_URI = `${getSiteUrl()}/api/auth/callback`;

// Public origin of the app. Inside Docker the request URL is the container's
// internal address (localhost:5000), so redirects are built from configuration.
export function publicUrl(path: string): URL {
  return new URL(path, getSiteUrl());
}

