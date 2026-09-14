import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Taskly — Make space for what matters',
  description: 'A calmer, clearer way to organize your day and make progress on what matters.',
  icons: {
    icon: '/logo.webp',
    apple: '/logo.webp',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#7057e8',
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}</body></html>
}
