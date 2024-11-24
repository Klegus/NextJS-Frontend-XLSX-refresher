import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.0.20';
export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string; group: string } }
) {
  try {
    // Ensure params are properly resolved before using
    const { collection, group } = params;
    
    const response = await fetch(
      `${API_URL}/api/plan/${encodeURIComponent(collection)}/${encodeURIComponent(group)}`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}
