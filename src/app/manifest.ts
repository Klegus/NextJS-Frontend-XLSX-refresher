import type { MetadataRoute } from 'next'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'Plan WSPA',
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f5f7',
    theme_color: '#e31e24',
    lang: 'pl',
    icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
  }
}
