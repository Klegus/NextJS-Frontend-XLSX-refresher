'use client';

import { createContext, useContext } from 'react';
import type { AccessMode } from '@/lib/access';

// Access mode decided on the server at request time (AUTH_MODE), exposed to components
const AccessContext = createContext<AccessMode>('public');

export const AccessProvider: React.FC<{ mode: AccessMode; children: React.ReactNode }> = ({ mode, children }) => (
  <AccessContext.Provider value={mode}>{children}</AccessContext.Provider>
);

export const useAccessMode = () => useContext(AccessContext);
