import type { MetadataRoute } from 'next'
import { getAccessMode, getSiteUrl } from '@/lib/access'

export const dynamic = 'force-dynamic'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const now = new Date()
  if (getAccessMode() === 'sso') {
    return [{ url: `${siteUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 1 }]
  }
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/egzaminy`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ]
}
