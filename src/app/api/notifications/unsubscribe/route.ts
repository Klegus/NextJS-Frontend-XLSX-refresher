import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { subscription, planId } = await request.json();
    
    // Forward the request to the backend
    const backendResponse = await fetch('http://localhost:5000/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscription, planId }),
    });

    if (!backendResponse.ok) {
      throw new Error('Backend request failed');
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
