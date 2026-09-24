import { NextResponse } from 'next/server';

import { API_URL } from '@/lib/config';

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/exams/faculties`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Backend responded with status: ${response.status}`);
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Error in exam faculties route:', error);
    return NextResponse.json({ programmes: [] }, { status: 500 });
  }
}
