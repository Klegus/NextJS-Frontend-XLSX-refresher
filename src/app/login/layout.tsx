import type { Metadata } from 'next'
import { SITE_DESCRIPTION } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Zaloguj się kontem uczelnianym',
  description: `${SITE_DESCRIPTION} Zaloguj się kontem Microsoft WSPA.`,
  alternates: { canonical: '/login' },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
