import { NextResponse } from 'next/server';

import { API_URL } from '@/lib/config';

import { denyWithoutAccess } from '@/lib/guard';

export async function GET(request: Request) {
  const denied = await denyWithoutAccess(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const collection = searchParams.get('collection');

    const url = collection
      ? `${API_URL}/api/changes/${encodeURIComponent(collection)}?limit=${limit}`
      : `${API_URL}/api/changes?limit=${limit}`;

    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ changes: [] }, { status: 500 });
  }
}
