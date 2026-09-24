import { NextResponse } from 'next/server';
import { shouldHideLecturers } from '@/lib/access';
import type { NextRequest } from 'next/server';

import { API_URL } from '@/lib/config';

// Proxy to the backend exam timetable; query string is passed through
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/api/exams?${request.nextUrl.searchParams.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Backend responded with status: ${response.status}`);
    const data = await response.json();
    // Exam timetable rows name the examiner – hide it like in the schedule
    if (shouldHideLecturers() && Array.isArray(data?.entries)) {
      data.entries = data.entries.map((e: Record<string, unknown>) => ({ ...e, lecturer: null }));
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in exams route:', error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}
