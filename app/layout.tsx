import type { Metadata } from 'next'
import './globals.css'
import Logo from "../components/Logo"
import HalftoneBackground from "../components/HalftoneBackground";
import { FilterProvider } from "../context/filter-context";
import FilterBar from "../components/FilterBar";
import GpsBridgeSync from "../components/GpsBridgeSync";

export const metadata: Metadata = {
  title: 'The Water Bar | Functional Hydration Coach',
  description: 'Personalized hydration solutions with our AI-powered Water Barista. Get exact fluid volumes tailored to your goals and lifestyle.',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'The Water Bar | Functional Hydration Coach',
    description: 'Chat with our AI Water Barista for personalized hydration guidance and functional drinks tailored to your needs.',
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
        
        {/* Optional: pastel gradient background */}
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-teal-500 to-cyan-400 z-[-2]" />
        {/* Animated halftone overlay */}
        <HalftoneBackground />
        {/* Main content */}
        <FilterProvider>
          <GpsBridgeSync />
          <Logo />
          <FilterBar />
          <div className="relative z-10">
            {children}
          </div>
        </FilterProvider>
      </body>
    </html>
  )
}
