import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { API_URL } from '@/lib/config';

import { denyWithoutAccess } from '@/lib/guard';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; faculty: string } }
) {
  const denied = await denyWithoutAccess(request);
  if (denied) return denied;

  try {
    // Await params before accessing its properties
    const { category, faculty } = await params; 

    const response = await fetch(
      `${API_URL}/api/plans/${encodeURIComponent(category)}/${encodeURIComponent(faculty)}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in plans route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}