import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { API_URL } from '@/lib/config';

import { denyWithoutAccess } from '@/lib/guard';
import { getClientIp } from '@/lib/clientIp';

export async function GET(request: NextRequest) {
  const denied = await denyWithoutAccess(request);
  if (denied) return denied;

  try {
    // Dodajemy User-Agent header, aby backend mógł zidentyfikować urządzenie
    const response = await fetch(`${API_URL}/api/suggestions/count`, {
      headers: {
        'User-Agent': request.headers.get('User-Agent') || '',
        // Address from the trusted proxy header (see lib/clientIp.ts); X-Forwarded-For can be forged
        'X-Client-IP': getClientIp(request),
      },
    });
    
    if (!response.ok) {
      throw new Error('Nie udało się pobrać liczby dostępnych sugestii');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Błąd podczas sprawdzania dostępnych sugestii:', error);
    // W przypadku błędu zwracamy domyślną wartość, zakładając że sugestie są dostępne
    return NextResponse.json({
      success: true,
      remaining_today: 5,  // Domyślnie zakładamy pełny limit
      message: 'Domyślna wartość z powodu błędu połączenia z backendem'
    });
  }
} 