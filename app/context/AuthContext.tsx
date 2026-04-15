'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface User {
  username: string
  rol: 'super_admin' | 'operator' | 'demo'
  nume: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isDemo: boolean
  isAdmin: boolean
  isOperator: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('greenhub_token')
    const savedUser = localStorage.getItem('greenhub_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
  }, [])

  const login = async (username: string, password: string) => {
    const res = await axios.post(`${API}/api/auth/login`, { username, password })
    const { token: newToken, username: uname, rol, nume } = res.data
    const userData = { username: uname, rol, nume }
    setToken(newToken)
    setUser(userData)
    localStorage.setItem('greenhub_token', newToken)
    // Seteaza cookie pentru middleware
    document.cookie = `greenhub_token=${newToken}; path=/; max-age=${8 * 3600}`
    localStorage.setItem('greenhub_user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const logout = async () => {
    try { await axios.post(`${API}/api/auth/logout`) } catch (e) {}
    setToken(null)
    setUser(null)
    localStorage.removeItem('greenhub_token')
    document.cookie = 'greenhub_token=; path=/; max-age=0'
    localStorage.removeItem('greenhub_user')
    delete axios.defaults.headers.common['Authorization']
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{
      user, token, login, logout,
      isDemo: user?.rol === 'demo',
      isAdmin: user?.rol === 'super_admin',
      isOperator: user?.rol === 'operator' || user?.rol === 'super_admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)