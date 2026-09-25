import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_URL } from '@/lib/config';
import { denyWithoutAccess } from '@/lib/guard';

export async function GET(request: NextRequest) {
  const denied = await denyWithoutAccess(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const skip = searchParams.get('skip');

    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit);
    if (skip) queryParams.append('skip', skip);

    const response = await fetch(
      `${API_URL}/api/activities?${queryParams.toString()}`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}