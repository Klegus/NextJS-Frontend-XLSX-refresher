import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { API_URL } from '@/lib/config';

import { denyWithoutAccess } from '@/lib/guard';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  const denied = await denyWithoutAccess(request);
  if (denied) return denied;

  try {
    // Await params before accessing category
    const { category } = await params; 

    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_URL}/api/faculties/${encodeURIComponent(category)}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in faculties route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}