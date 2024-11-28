import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.0.20';

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
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      plan_html: data.plan_html,
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