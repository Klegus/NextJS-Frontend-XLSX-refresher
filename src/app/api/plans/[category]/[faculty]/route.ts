import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.0.20';
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; faculty: string } }
) {
  try {
    const response = await fetch(
      `${API_URL}/api/plans/${params.category}/${params.faculty}`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}