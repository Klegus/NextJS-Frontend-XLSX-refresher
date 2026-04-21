import { NextRequest, NextResponse } from 'next/server';
import { createAuthToken, SERVER_REDIRECT_URI, sanitizeRedirectUrl } from '@/lib/msauth-server';

// Funkcja pomocnicza do tworzenia tokenu i przekierowania
async function createAndReturnToken(userData: { id: string, name: string, email: string }, request: NextRequest) {
  // Utwórz token uwierzytelniający
  const authToken = await createAuthToken(userData);
  
  console.log('Request headers:', Object.fromEntries(request.headers));
  console.log('Request URL:', request.url);
  
  // Najprostsza wersja - używamy strony głównej
  let homepageUrl: string;
  if (process.env.NODE_ENV === 'production') {
    // W produkcji zawsze używamy pełnego URL
    homepageUrl = 'https://dev.planinf.pl/';
  } else {
    // W trybie dev możemy użyć względnego URL
    homepageUrl = '/';
  }
  
  console.log('Przekierowuję na:', homepageUrl);
  
  // Tworzymy odpowiedź z NextResponse, który ma metodę cookies
  const response = NextResponse.redirect(homepageUrl, {
    // Używamy kodu 302 (Found)
    status: 302
  });
  
  // Dodajemy nagłówki zapobiegające cachowaniu
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  
  // Ustaw token w cookie
  response.cookies.set({
    name: 'auth-token',
    value: authToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 dzień
    path: '/',
  });
  
  return response;
}

export async function GET(request: NextRequest) {
  // Szczegółowe logowanie
  console.log('====== AUTH CALLBACK ======');
  console.log('Request URL:', request.url);
  console.log('Request headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
  console.log('Request nextUrl:', request.nextUrl.toString());
  console.log('Host header:', request.headers.get('host'));
  console.log('Referer:', request.headers.get('referer'));
  console.log('Origin:', request.headers.get('origin'));
  console.log('===========================');

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  // Sprawdź, czy wystąpił błąd
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }
  
  // Sprawdź, czy otrzymaliśmy kod autoryzacyjny
  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=No+authorization+code+received', request.url)
    );
  }
  
  try {
    // Sprawdź, czy tenant ID jest skonfigurowany
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    if (!tenantId) {
      throw new Error('Azure AD Tenant ID not configured');
    }
    
    // Wymień kod autoryzacyjny na token dostępu
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID || '',
      client_secret: process.env.AZURE_AD_CLIENT_SECRET || '',
      code,
      redirect_uri: SERVER_REDIRECT_URI,
      grant_type: 'authorization_code',
    });
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || 'Failed to exchange code for token');
    }
    
    const tokenData = await tokenResponse.json();
    
    // Pobierz informacje o użytkowniku
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      // Pobierz więcej szczegółów o błędzie
      const errorText = await userInfoResponse.text();
      console.error('Graph API error details:', errorText);
      console.error('Token details:', tokenData);
      
      // Spróbujmy użyć informacji z tokenu zamiast pobierać z Graph API
      if (tokenData.id_token) {
        try {
          // Dekoduj id_token (to jest token JWT)
          const tokenParts = tokenData.id_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            
            // Użyj danych z tokenu ID
            return await createAndReturnToken({
              id: payload.oid || payload.sub,
              name: payload.name,
              email: payload.preferred_username || payload.email,
            }, request);
          }
        } catch (tokenError) {
          console.error('Error decoding id_token:', tokenError);
        }
      }
      
      throw new Error(`Failed to fetch user info: ${errorText}`);
    }
    
    const userData = await userInfoResponse.json();
    
    // Użyj funkcji pomocniczej do utworzenia tokenu i przekierowania
    return await createAndReturnToken({
      id: userData.id,
      name: userData.displayName,
      email: userData.userPrincipalName || userData.mail,
    }, request);
  } catch (error: any) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
