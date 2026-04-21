import { jwtVerify, SignJWT } from 'jose';

// Funkcja do weryfikacji tokenu JWT (używana w middleware)
export async function verifyAuthToken(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

// Funkcja do utworzenia tokenu JWT po pomyślnym uwierzytelnieniu
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

// Stałe dla Microsoft OAuth
export const MICROSOFT_OAUTH_URL = 'https://login.microsoftonline.com';
console.log('REDIRECT_URI from env:', process.env.REDIRECT_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Specjalne zabezpieczenie: zawsze używamy konkretnej wartości w środowisku produkcyjnym,
// bez względu na inne ustawienia
export const SERVER_REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? 'https://dev.planinf.pl/api/auth/callback' 
  : (process.env.REDIRECT_URI || 'http://localhost:5000/api/auth/callback');

console.log('Using REDIRECT_URI:', SERVER_REDIRECT_URI);

// Rozszerzona funkcja do naprawiania URL-i przekierowań
export function sanitizeRedirectUrl(url: string): string {
  // W produkcji naprawiamy wszystkie adresy localhost
  if (process.env.NODE_ENV === 'production') {
    // Sprawdzanie różnych wersji adresów localhost
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      console.warn('Wykryto próbę przekierowania na localhost w produkcji!');
      console.warn('Oryginalny URL:', url);
      
      // Tworzymy nowy URL z poprawną domeną
      const fixedUrl = url
        .replace(/https?:\/\/localhost:[0-9]+/g, 'https://dev.planinf.pl')
        .replace(/https?:\/\/127\.0\.0\.1:[0-9]+/g, 'https://dev.planinf.pl');
      
      console.warn('Poprawiony URL:', fixedUrl);
      return fixedUrl;
    }
  }
  return url;
}
