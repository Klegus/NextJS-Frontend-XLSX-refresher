import type { MetadataRoute } from 'next'
import { getAccessMode, getSiteUrl } from '@/lib/access'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()
  // With SSO the schedule is behind sign-in; only the landing/login page is indexable
  const disallow = getAccessMode() === 'sso' ? ['/api/', '/egzaminy'] : ['/api/']
  return {
    rules: { userAgent: '*', allow: '/', disallow },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
