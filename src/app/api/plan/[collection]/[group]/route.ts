import { NextResponse } from 'next/server';
import { protectLecturers } from '@/lib/lecturers';
import type { NextRequest } from 'next/server';

import { API_URL } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string; group: string } }
) {
  try {
    // Await params before accessing its properties
    const { collection, group } = await params;

    if (!collection || !group) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const encodedCollection = encodeURIComponent(collection);
    const encodedGroup = encodeURIComponent(group);

    const response = await fetch(`${API_URL}/api/plan/${encodedCollection}/${encodedGroup}`);
    
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

    return NextResponse.json({
      plan_html: protectLecturers(data.plan_html),
      notes: data.notes,
      timestamp: data.timestamp,
      category: data.category
    });

  } catch (error) {
    console.error('Error in plan route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch plan', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}