import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo'

// Link preview image (Messenger, WhatsApp, Teams, Google)
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = SITE_NAME

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: 'linear-gradient(135deg, #ffffff 0%, #f3f3f6 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 20, height: 80, background: '#e31e24', borderRadius: 10 }} />
          <div style={{ fontSize: 36, color: '#58595b', fontWeight: 600 }}>WSPA Lublin</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 88, fontWeight: 800, color: '#1f1f23' }}>Plan zajęć</div>
          <div style={{ fontSize: 38, color: '#58595b' }}>Wszystkie kierunki i grupy · Terminarz egzaminów · Kalendarz w telefonie</div>
        </div>
        <div style={{ fontSize: 30, color: '#e31e24', fontWeight: 600 }}>PL · EN · UA</div>
      </div>
    ),
    size,
  )
}
