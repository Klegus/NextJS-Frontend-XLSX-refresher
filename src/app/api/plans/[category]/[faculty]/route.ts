import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.0.20';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; faculty: string } }
) {
  try {
    const category = await params.category;
    const faculty = await params.faculty;
    
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
      { error: 'Failed to fetch plans', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
