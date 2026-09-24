import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terminarz egzaminów i zaliczeń',
  description: 'Terminy egzaminów, zaliczeń i poprawek na WSPA Lublin – dopasowane do Twojego kierunku, roku i trybu studiów.',
  alternates: { canonical: '/egzaminy' },
}

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  return children
}
