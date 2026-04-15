'use client'

import { useAuth } from '../context/AuthContext'
import { usePathname } from 'next/navigation'

export default function DemoOverlay() {
  const { isDemo } = useAuth()
  const pathname = usePathname()

  if (!isDemo || pathname === '/login') return null

  return (
    <>
      {/* Overlay transparent care blocheaza click-urile */}
      <div
        className="fixed inset-0 z-30 cursor-not-allowed"
        style={{ pointerEvents: 'all' }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.preventDefault()}
      />
      {/* Banner demo */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-900 border border-yellow-600 rounded-xl px-6 py-2 text-yellow-200 text-sm font-medium">
        👁️ Mod Demo — doar vizualizare
      </div>
    </>
  )
}