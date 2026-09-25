import { NextRequest, NextResponse } from 'next/server';
import {
  createAuthToken, SERVER_REDIRECT_URI,
  OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, oauthEndpoint, publicUrl,
} from '@/lib/msauth-server';

// Only a fixed code goes to the login page; details stay in the server log
function loginError(code: 'expired' | 'failed', request: NextRequest, detail?: string) {
  if (detail) console.error('Sign-in failed:', detail);
  const response = NextResponse.redirect(publicUrl(`/login?error=${code}`));
  clearOAuthCookies(response);
  return response;
}

function clearOAuthCookies(response: NextResponse) {
  for (const name of [OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE]) {
    response.cookies.set({ name, value: '', path: '/api/auth', maxAge: 0, httpOnly: true });
  }
}

// Tworzy token i przekierowuje na stronę główną
async function createAndReturnToken(userData: { id: string, name: string, email: string }, request: NextRequest) {
  const authToken = await createAuthToken(userData);

  const homepageUrl = publicUrl('/');

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
    sameSite: 'lax',
  });
  clearOAuthCookies(response);

  return response;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // The state must match the one issued by /api/auth/login (login CSRF protection)
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value;
  if (!error && (!expectedState || !codeVerifier || searchParams.get('state') !== expectedState)) {
    return loginError('expired', request);
  }
  
  // Sprawdź, czy wystąpił błąd
  if (error) {
    return loginError('failed', request, errorDescription || error);
  }
  
  // Sprawdź, czy otrzymaliśmy kod autoryzacyjny
  if (!code) {
    return loginError('failed', request, 'No authorization code received');
  }
  
  try {
    // Wymień kod autoryzacyjny na token dostępu
    const tokenEndpoint = oauthEndpoint('token');
    const params = new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID || '',
      client_secret: process.env.AZURE_AD_CLIENT_SECRET || '',
      code,
      redirect_uri: SERVER_REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier || '',
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
      
      // No fallback to decoding the id_token: without verifying its signature,
      // issuer and audience its claims cannot be trusted
      throw new Error('Failed to fetch user info from Microsoft Graph');
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
    return loginError('failed', request, error?.message);
  }
}
