import { NextResponse } from 'next/server';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.0.20';

export async function POST(request: Request) {
  try {
    const { subscription, collectionName } = await request.json();
    
    // Forward the request to the backend
    const backendResponse = await fetch(NEXT_PUBLIC_API_URL +'/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ subscription, collectionName }),
      mode: 'cors',
      credentials: 'include'
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('Backend subscription error:', errorData);
      throw new Error('Backend request failed: ' + JSON.stringify(errorData));
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe', details: error.message },
      { status: 500 }
    );
  }
}
