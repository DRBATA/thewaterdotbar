import type { Metadata } from 'next'
import './globals.css'
import Logo from "../components/Logo"
import HalftoneBackground from "../components/HalftoneBackground";

export const metadata: Metadata = {
  title: 'The Water Bar x Johny Dar | AI Morning Party',
  description: 'Book your morning party with our AI Barista, a unique experience by The Water Bar and Johny Dar.',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'The Water Bar x Johny Dar | AI Morning Party',
    description: 'Book your morning party with our AI Barista.',
    url: 'https://thewater.bar',
    siteName: 'The Water Bar',
    images: [
      {
        url: 'https://thewater.bar/apple-touch-icon.png',
        width: 180,
        height: 180,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Logo />
        {/* Optional: pastel gradient background */}
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-100 via-pink-100 to-cyan-100 z-[-2]" />
        {/* Animated halftone overlay */}
        <HalftoneBackground />
        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
