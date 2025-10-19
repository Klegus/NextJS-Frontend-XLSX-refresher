import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Use server-side env var for API routes (not embedded in build)
// Fallback chain: API_BASE_URL -> NEXT_PUBLIC_API_BASE_URL -> Docker network IP
const API_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://172.30.0.20';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/api/status`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}