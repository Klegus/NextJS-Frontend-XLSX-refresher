import { NextResponse } from 'next/server';
import { protectLecturers } from '@/lib/lecturers';
import type { NextRequest } from 'next/server';

import { API_URL } from '@/lib/config';

import { denyWithoutAccess } from '@/lib/guard';

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string; group: string } }
) {
  const denied = await denyWithoutAccess(request);
  if (denied) return denied;

  try {
    // Await params before accessing its properties
    const { collection, group } = await params;

    if (!collection || !group) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const encodedCollection = encodeURIComponent(collection);
    const encodedGroup = encodeURIComponent(group);

    const response = await fetch(`${API_URL}/api/plan/${encodedCollection}/${encodedGroup}`);
    
    if (response.status === 423) {
      // Plan quarantined by source validation - pass the message to the student
      const data = await response.json();
      return NextResponse.json(
        { error: 'blocked', message: data?.detail?.message },
        { status: 423 }
      );
    }

    if (response.status >= 400 && response.status < 500) {
      // Unknown plan/group or invalid request - pass the status on, not a 500
      return NextResponse.json({ error: response.status === 404 ? 'not_found' : 'bad_request' },
        { status: response.status });
    }
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Weekend studies: on-line lectures published as a separate sheet come along
    const companion = data.companion?.groups ? {
      label: String(data.companion.label || ''),
      groups: Object.fromEntries(Object.entries(data.companion.groups as Record<string, string>)
        .map(([g, html]) => [g, protectLecturers(html)])),
      zjazdy: data.companion.zjazdy || undefined,
    } : undefined;

    return NextResponse.json({
      plan_html: protectLecturers(data.plan_html),
      notes: data.notes,
      timestamp: data.timestamp,
      category: data.category,
      ...(companion ? { companion } : {}),
      ...(data.zjazdy ? { zjazdy: data.zjazdy } : {}),
    });

  } catch (error) {
    console.error('Error in plan route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch plan'
      },
      { status: 500 }
    );
  }
}