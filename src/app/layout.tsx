import './globals.css'
import { Inter } from 'next/font/google'
import { LoadingBar } from '@/components/ui/LoadingBar'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'Plan Zajęć - WSPA',
  description: 'Plan zajęć dla studentów WSPA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className={`${inter.variable} font-sans antialiased`}>
        <LoadingBar />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}