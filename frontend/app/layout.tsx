import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { SocketProvider } from '@/lib/socket-context'
import { BottomTabs } from '@/components/bottom-tabs'
import { PWAInit } from '@/components/pwa-init'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gym Scroller',
  description: 'Mobile-first strength training app with rep-locked video feed',
  generator: 'Next.js',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gym Scroller',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SocketProvider>
            <PWAInit />
            <div className="pb-16">
              {children}
            </div>
            <BottomTabs />
          </SocketProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
