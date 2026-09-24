import { NextResponse } from 'next/server';

import { API_URL } from '@/lib/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
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
