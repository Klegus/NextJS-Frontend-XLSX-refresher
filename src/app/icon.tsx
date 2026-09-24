import { ImageResponse } from 'next/og'

// Simple generated app icon (calendar glyph) – no third-party logo hotlinking
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e31e24', borderRadius: 112 }}>
        <div style={{ width: 300, height: 280, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 36, overflow: 'hidden' }}>
          <div style={{ height: 70, background: '#1f1f23' }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 150, fontWeight: 800, color: '#e31e24' }}>P</div>
        </div>
      </div>
    ),
    size,
  )
}
