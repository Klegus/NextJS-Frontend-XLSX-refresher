import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { API_URL } from '@/lib/config';

// API endpoint do wysyłania sugestii
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Sprawdź, czy sugestia nie jest pusta
    if (!data.content || !data.content.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Treść sugestii nie może być pusta' 
      }, { status: 400 });
    }
    
    // Ograniczamy długość sugestii do 500 znaków
    if (data.content.length > 500) {
      return NextResponse.json({
        success: false,
        message: 'Treść sugestii nie może przekraczać 500 znaków'
      }, { status: 400 });
    }
    
    // Przekieruj żądanie do właściwego backendu
    const response = await fetch(`${API_URL}/api/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('User-Agent') || '',
        // Cloudflare sets CF-Connecting-IP itself; X-Forwarded-For can be forged by the client
        'X-Client-IP': request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '',
      },
      body: JSON.stringify({ content: data.content }),
    });
    
    const responseData = await response.json();
    
    // Przekazujemy odpowiedź z backendu do klienta
    return NextResponse.json(responseData, { status: response.status });
    
  } catch (error) {
    console.error('Błąd podczas dodawania sugestii:', error);
    return NextResponse.json({
      success: false,
      message: 'Wystąpił błąd podczas przetwarzania żądania'
    }, { status: 500 });
  }
} 