'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wrench, BarChart2, MessageSquare, ClipboardList, Layers, Leaf } from 'lucide-react'

const meniu = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/control', label: 'Control', icon: Wrench },
  { href: '/grafice', label: 'Grafice', icon: BarChart2 },
  { href: '/productie', label: 'Producție', icon: Layers },
  { href: '/jurnal', label: 'Jurnal', icon: ClipboardList },
  { href: '/specii', label: 'Specii', icon: Leaf },
  { href: '/istoric-chat', label: 'Istoric Chat', icon: MessageSquare },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <span className="text-green-400 font-bold text-lg">🌱 Greenhub</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {meniu.map(item => {
          const Icon = item.icon
          const activ = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activ
                  ? 'bg-green-700 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon size={16}/>
              <span className="hidden md:block">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}