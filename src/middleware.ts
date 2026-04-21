import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/msauth-server';

// Funkcja verifyAuthToken jest teraz importowana z msauth-server.ts

export async function middleware(request: NextRequest) {
  // Lista ścieżek publicznych nie wymagających uwierzytelnienia
  const publicUrls = [
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/callback',
    '/api/auth/providers',
    '/api/auth/error',
    '/login',
    '/favicon.ico',
    '/_next',
    '/public'
  ];

  // Sprawdź, czy żądana ścieżka jest publiczna
  const isPublicRoute = publicUrls.some(url => request.nextUrl.pathname.startsWith(url));

  // Obsługa żądań CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Obsługa nagłówków CORS dla żądań API (z wyjątkiem auth)
  if (request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    const response = NextResponse.next();

    // Dodaj nagłówki CORS do wszystkich odpowiedzi
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  }

  // Jeśli jest to publiczna ścieżka, przepuść żądanie bez sprawdzania uwierzytelnienia
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Pobierz token autoryzacji z ciasteczka
  const authToken = request.cookies.get('auth-token')?.value;

  // Sprawdź, czy token jest ważny
  const isAuthenticated = authToken ? await verifyAuthToken(authToken) : null;

  // Jeśli użytkownik nie jest uwierzytelniony, przekieruj na stronę logowania
  if (!isAuthenticated) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // W przeciwnym razie, przepuść żądanie (użytkownik jest uwierzytelniony)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Dopasuj wszystkie ścieżki żądań z wyjątkiem tych zaczynających się od:
     * - _next/static (pliki statyczne)
     * - _next/image (pliki optymalizacji obrazów)
     * - favicon.ico (plik favicon)
     * - public (pliki publiczne)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};