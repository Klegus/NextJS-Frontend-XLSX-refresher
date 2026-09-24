import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { LoadingBar } from '@/components/ui/LoadingBar'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { AccessProvider } from '@/components/auth/AccessContext'
import { LanguageProvider } from '@/i18n'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { getAccessMode, getSiteUrl } from '@/lib/access'
import { SITE_DESCRIPTION, SITE_NAME, structuredData } from '@/lib/seo'

// Access mode and site URL are read at request time, so one image serves
// both SSO and public deployments on any domain
export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
})

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  return {
    metadataBase: new URL(siteUrl),
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    alternates: { canonical: '/' },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
    openGraph: {
      type: 'website',
      url: siteUrl,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      locale: 'pl_PL',
      alternateLocale: ['en_GB', 'uk_UA'],
    },
    twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION },
    formatDetection: { telephone: false },
  }
}

export const viewport: Viewport = {
  themeColor: '#e31e24',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased relative`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
        />
        <LoadingBar />
        <AccessProvider mode={getAccessMode()}>
          <LanguageProvider>
            <LanguageSwitcher />
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </AccessProvider>
      </body>
    </html>
  )
}
