import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Greenhub Dashboard',
  description: 'Sistem monitorizare vertical farming',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <body className={`${inter.className} bg-gray-950`}>
        <Navigation />
        {children}
      </body>
    </html>
  )
}