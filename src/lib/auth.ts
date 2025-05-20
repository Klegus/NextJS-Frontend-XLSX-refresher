// Ten plik jest używany tylko dla komponentów klienckich

'use client';

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

// Proste wrappery dla funkcji next-auth dla używania w komponentach
export const signIn = (provider: string, options?: any) => {
  return nextAuthSignIn(provider, options);
};

export const signOut = (options?: any) => {
  return nextAuthSignOut(options);
};

// Nie implementujemy tutaj auth() - to jest obsługiwane przez middleware bezpośrednio
// z użyciem jose do weryfikacji JWT
