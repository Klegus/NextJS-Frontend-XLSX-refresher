import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Generuj klucze VAPID używając web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'mailto:your-email@wspia.edu.pl',
  vapidKeys.publicKey!,
  vapidKeys.privateKey!
);

export async function POST(request: Request) {
  try {
    const { subscription, planId } = await request.json();
    
    // Tutaj zapisz subskrypcję w bazie danych wraz z planId
    // Przykład: await db.subscriptions.create({ subscription, planId })
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
