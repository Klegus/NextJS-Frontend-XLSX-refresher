import { NextResponse } from 'next/server';
import { protectLecturers } from '@/lib/lecturers';
import type { NextRequest } from 'next/server';

import { API_URL } from '@/lib/config';

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

    if (response.status === 423) {
      // Plan quarantined by source validation - pass the message to the student
      const data = await response.json();
      return NextResponse.json(
        { error: 'blocked', message: data?.detail?.message },
        { status: 423 }
      );
    }

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (data?.group_htmls) {
      data.group_htmls = Object.fromEntries(
        Object.entries(data.group_htmls as Record<string, string>).map(([g, html]) => [g, protectLecturers(html)])
      );
    }

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