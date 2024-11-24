// File: src/app/api/faculties/[category]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.0.20';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    if (!params?.category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_URL}/api/faculties/${encodeURIComponent(params.category)}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in faculties route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculties', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
