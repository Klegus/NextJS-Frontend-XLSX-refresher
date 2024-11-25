import { NextResponse } from 'next/server';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.0.20';

export async function POST(request: Request) {
  try {
    const { subscription, planId } = await request.json();
    
    // Forward the request to the backend
    const backendResponse = await fetch(NEXT_PUBLIC_API_URL +'/api/notifications/subscribe', {
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
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
