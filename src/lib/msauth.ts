'use client';

// Sign-in starts on the server (/api/auth/login), which issues the OAuth state
// and PKCE verifier in httpOnly cookies - nothing sensitive lives in the bundle
export async function loginWithMicrosoft() {
  window.location.href = '/api/auth/login';
}

// Te funkcje zostały przeniesione do pliku msauth-server.ts

// Funkcja do wylogowania
export function logout() {
  if (typeof window !== 'undefined') {
    // The session cookie is httpOnly - only the server can clear it
    window.location.href = '/api/auth/logout';
  }
}
