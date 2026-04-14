'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

export default function Navigation() {
  const pathname = usePathname()
  const [nrAlerte, setNrAlerte] = useState(0)

  const fetchAlerte = async () => {
    try {
      const res = await axios.get(`${API}/api/alerte`)
      const active = res.data.filter((a: any) => !a.rezolvat)
      setNrAlerte(active.length)
    } catch (e) {}
  }

  useEffect(() => {
    fetchAlerte()
    const interval = setInterval(fetchAlerte, 30000)
    return () => clearInterval(interval)
  }, [])

  const links = [
    { href: '/', label: 'Dashboard', icon: '⊞', badge: false },
    { href: '/control', label: 'Control', icon: '⚙️', badge: false },
    { href: '/grafice', label: 'Grafice', icon: '📈', badge: false },
    { href: '/productie', label: 'Producție', icon: '🌿', badge: false },
    { href: '/jurnal', label: 'Jurnal', icon: '📋', badge: false },
    { href: '/rapoarte', label: 'Rapoarte', icon: '📊', badge: false },
    { href: '/specii', label: 'Specii', icon: '🌱', badge: false },
    { href: '/alerte', label: 'Alerte', icon: '🚨', badge: true },
    { href: '/setari', label: 'Setări', icon: '⚙️', badge: false },
    { href: '/istoric-chat', label: 'Istoric Chat', icon: '💬', badge: false },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <span className="text-green-400 font-bold text-lg">🌱 Greenhub</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {links.map(link => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : link.badge && nrAlerte > 0
                    ? 'text-red-400 hover:text-white hover:bg-red-900'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {link.label}
              {link.badge && nrAlerte > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {nrAlerte > 9 ? '9+' : nrAlerte}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}