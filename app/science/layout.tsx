"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Droplet, Zap, Apple, Heart, Activity } from 'lucide-react'

export default function ScienceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/science', label: 'How It Works', icon: Activity },
    { href: '/science/hydration', label: 'Hydration', icon: Droplet },
    { href: '/science/electrolytes', label: 'Electrolytes', icon: Zap },
    { href: '/science/protein', label: 'Protein', icon: Apple },
    { href: '/science/microbiome', label: 'Microbiome', icon: Heart },
    { href: '/science/energy', label: 'Energy', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Droplet className="h-8 w-8 text-teal-600" />
              <span className="text-xl font-bold text-gray-900">Water Bar</span>
              <span className="text-sm text-gray-500 hidden sm:inline">/ Science</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-teal-100 text-teal-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* CTA + Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="hidden sm:block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                Shop Drinks
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                      isActive
                        ? 'bg-teal-100 text-teal-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full mt-4 px-4 py-3 bg-teal-600 text-white text-center rounded-lg font-medium"
              >
                Shop Drinks
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Water Bar. Science-backed hydration.</p>
            <div className="mt-2 space-x-4">
              <Link href="/" className="hover:text-teal-600">Shop</Link>
              <Link href="/staff" className="hover:text-teal-600">Staff Portal</Link>
              <Link href="/privacy" className="hover:text-teal-600">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
