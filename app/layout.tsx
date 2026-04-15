import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from './context/AuthContext'

export const metadata: Metadata = {
  title: 'Greenhub — Ultragreens Farm',
  description: 'Dashboard vertical farming',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className="bg-gray-950 text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}