'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [eroare, setEroare] = useState('')

  const handleLogin = async () => {
    if (!username || !password) { setEroare('Completează toate câmpurile'); return }
    setLoading(true)
    setEroare('')
    try {
      await login(username, password)
      router.push('/')
    } catch (e: any) {
      setEroare(e.response?.data?.detail || 'Eroare la autentificare')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌱</div>
          <h1 className="text-3xl font-bold text-green-400">Greenhub</h1>
          <p className="text-gray-500 mt-1">Ultragreens Farm</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          {eroare && (
            <div className="bg-red-950 border border-red-700 rounded-xl p-3 mb-4 text-red-300 text-sm text-center">
              ⚠️ {eroare}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="username"
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-600"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Parolă</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-600"
                autoComplete="current-password"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl font-bold text-sm mt-2"
            >
              {loading ? '⏳ Se conectează...' : '🔐 Autentificare'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}