import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Use server-side env var for API routes (not embedded in build)
// Fallback chain: API_BASE_URL -> NEXT_PUBLIC_API_BASE_URL -> Docker network IP
const API_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://172.20.0.20';
export async function GET(request: NextRequest) {
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