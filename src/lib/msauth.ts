'use client';

// Stałe dla Microsoft OAuth
const MICROSOFT_OAUTH_URL = 'https://login.microsoftonline.com';

// Funkcja do generowania adresu przekierowania (bezpieczna dla SSR)
function getRedirectUri() {
  // W środowisku produkcyjnym zawsze używamy stałego adresu
  if (process.env.NODE_ENV === 'production') {
    console.log('Produkcja: używam stałego adresu https://dev.planinf.pl/api/auth/callback');
    return 'https://dev.planinf.pl/api/auth/callback';
  }
  
  // Wymuszamy użycie zmiennej środowiskowej, jeśli jest ustawiona
  if (process.env.NEXT_PUBLIC_REDIRECT_URI) {
    console.log('Używam NEXT_PUBLIC_REDIRECT_URI:', process.env.NEXT_PUBLIC_REDIRECT_URI);
    return process.env.NEXT_PUBLIC_REDIRECT_URI;
  }
  
  // W środowisku produkcyjnym nie powinniśmy tutaj trafiać
  console.warn('NEXT_PUBLIC_REDIRECT_URI nie jest ustawiony, używam wartości domyślnej');
  
  if (typeof window === 'undefined') {
    return '';
  }
  
  // Ostateczność: używamy window.location (może być niepoprawne za proxy)
  return `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/api/auth/callback`;
}

// Funkcja do przekierowania na stronę logowania Microsoft
export async function loginWithMicrosoft() {
  const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID;
  const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID;
  
  if (!tenantId) {
    throw new Error('Azure AD Tenant ID not configured');
  }
  
  if (!clientId) {
    throw new Error('Azure AD Client ID not configured');
  }
  
  const authUrl = `${MICROSOFT_OAUTH_URL}/${tenantId}/oauth2/v2.0/authorize`;
  const redirectUri = getRedirectUri();
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email User.Read',
    state: createState(),
  });
  
  window.location.href = `${authUrl}?${params.toString()}`;
}

// Funkcja do utworzenia losowego stanu dla bezpieczeństwa
function createState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Te funkcje zostały przeniesione do pliku msauth-server.ts

// Funkcja do wylogowania
export function logout() {
  if (typeof window !== 'undefined') {
    // Usuń token i przekieruj na stronę logowania
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
  }
}
