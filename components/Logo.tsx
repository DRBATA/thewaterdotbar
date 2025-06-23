"use client"

import Image from "next/image"
import Link from "next/link"

export default function Logo() {
  return (
    <Link
      href="/"
      className="fixed top-4 left-4 z-20 drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
      aria-label="The Water Bar Home"
    >
      <Image
        src="/android-chrome-192x192.png"
        alt="The Water Bar Logo"
        height={56}
        width={56}
        priority
        className="h-14 w-auto"
      />
    </Link>
  )
}
