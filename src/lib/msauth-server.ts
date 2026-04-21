import { jwtVerify, SignJWT } from 'jose';

// Weryfikacja tokenu JWT (używana w middleware)
export async function verifyAuthToken(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

// Tworzenie tokenu JWT po pomyślnym uwierzytelnieniu
export async function createAuthToken(userData: any): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key');

  return new SignJWT({
    sub: userData.id,
    name: userData.name,
    email: userData.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

// Stałe Microsoft OAuth
export const MICROSOFT_OAUTH_URL = 'https://login.microsoftonline.com';

// Bazowy URL produkcyjny — konfigurowalny przez env var
const PRODUCTION_BASE_URL = process.env.PRODUCTION_BASE_URL || 'https://planinf.pl';

// URL przekierowania po autoryzacji (priorytet: REDIRECT_URI env > produkcja > localhost)
export const SERVER_REDIRECT_URI = process.env.REDIRECT_URI
  || (process.env.NODE_ENV === 'production'
    ? `${PRODUCTION_BASE_URL}/api/auth/callback`
    : 'http://localhost:3000/api/auth/callback');

// Naprawianie URL-i przekierowań — chroni przed tym że OAuth provider
// przekierowuje z powrotem na localhost w produkcji
export function sanitizeRedirectUrl(url: string): string {
  if (process.env.NODE_ENV !== 'production') return url;

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    const fixedUrl = url
      .replace(/https?:\/\/localhost(:[0-9]+)?/g, PRODUCTION_BASE_URL)
      .replace(/https?:\/\/127\.0\.0\.1(:[0-9]+)?/g, PRODUCTION_BASE_URL);
    console.warn(`Sanitized redirect: ${url} -> ${fixedUrl}`);
    return fixedUrl;
  }
  return url;
}
