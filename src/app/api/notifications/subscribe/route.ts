import { NextResponse } from 'next/server';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.0.20';

export async function POST(request: Request) {
  try {
    const { subscription, collectionName } = await request.json();
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Add Windows Push Notification specific headers if endpoint is from Windows
    if (subscription.endpoint?.includes('notify.windows.com')) {
      headers['X-WNS-Type'] = 'wns/toast';
      headers['X-WNS-RequestForStatus'] = 'true';
      headers['X-WNS-Tag'] = 'tag';
      headers['X-WNS-TTL'] = '900';
    }

    // Forward the request to the backend
    const backendResponse = await fetch(NEXT_PUBLIC_API_URL +'/api/notifications/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({ subscription, collectionName })
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to subscribe', details: errorMessage },
      { status: 500 }
    );
  }
}
