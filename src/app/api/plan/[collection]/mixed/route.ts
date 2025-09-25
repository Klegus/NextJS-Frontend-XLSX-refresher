import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Use server-side env var for API routes (not embedded in build)
// Fallback chain: API_BASE_URL -> NEXT_PUBLIC_API_BASE_URL -> Docker network IP
const API_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://172.20.0.20';

export async function POST(
  request: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    // Await params before accessing its properties
    const { collection } = await params;

    if (!collection) {
      return NextResponse.json(
        { error: 'Missing collection parameter' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();

    if (!body.groups || !Array.isArray(body.groups)) {
      return NextResponse.json(
        { error: 'Groups array is required' },
        { status: 400 }
      );
    }

    const encodedCollection = encodeURIComponent(collection);

    // Forward the POST request to the backend
    const response = await fetch(`${API_URL}/api/plan/${encodedCollection}/mixed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in mixed plan route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch mixed plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}