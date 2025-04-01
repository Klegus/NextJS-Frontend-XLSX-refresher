import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.0.20';

export async function GET(request: NextRequest) {
  try {
    // Dodajemy User-Agent header, aby backend mógł zidentyfikować urządzenie
    const response = await fetch(`${API_URL}/api/suggestions/count`, {
      headers: {
        'User-Agent': request.headers.get('User-Agent') || '',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '',
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