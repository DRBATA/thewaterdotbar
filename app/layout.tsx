import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Water Bar x Johnny Dar | AI Morning Party',
  description: 'Book your morning party with our AI Barista, a unique experience by The Water Bar and Johnny Dar.',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'The Water Bar x Johnny Dar | AI Morning Party',
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
      <body>{children}</body>
    </html>
  )
}
