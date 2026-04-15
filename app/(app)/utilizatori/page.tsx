'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { Plus, X, Edit } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Utilizatori() {
  const { isAdmin, user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [accessLog, setAccessLog] = useState<any[]>([])
  const [showFormular, setShowFormular] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [form, setForm] = useState({ username: '', password: '', rol: 'operator', nume_complet: '', email: '', activ: true })
  const [loading, setLoading] = useState(false)
  const [eroare, setEroare] = useState('')
  const [tab, setTab] = useState<'users' | 'log'>('users')

  useEffect(() => {
    if (!isAdmin) { router.push('/'); return }
    fetchUsers()
    fetchLog()
  }, [isAdmin])

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/api/users`)
    setUsers(res.data)
  }

  const fetchLog = async () => {
    const res = await axios.get(`${API}/api/access-log?limit=100`)
    setAccessLog(res.data)
  }

  const salveaza = async () => {
    setLoading(true)
    setEroare('')
    try {
      if (editUser) {
        await axios.put(`${API}/api/users/${editUser.id}`, form)
      } else {
        await axios.post(`${API}/api/users`, form)
      }
      setShowFormular(false)
      setEditUser(null)
      setForm({ username: '', password: '', rol: 'operator', nume_complet: '', email: '', activ: true })
      fetchUsers()
    } catch (e: any) {
      setEroare(e.response?.data?.detail || 'Eroare la salvare')
    }
    setLoading(false)
  }

  const getActiuneStyle = (actiune: string) => {
    if (actiune.includes('failed')) return 'text-red-400'
    if (actiune.includes('logout')) return 'text-yellow-400'
    if (actiune.includes('login')) return 'text-green-400'
    return 'text-gray-400'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-400">👥 Utilizatori</h1>
          <p className="text-gray-500 text-sm">Gestionare conturi și istoric acces</p>
        </div>
        {tab === 'users' && (
          <button
            onClick={() => { setShowFormular(true); setEditUser(null); setForm({ username: '', password: '', rol: 'operator', nume_complet: '', email: '', activ: true }) }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16}/> Utilizator nou
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'users' ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
          👥 Conturi ({users.length})
        </button>
        <button onClick={() => setTab('log')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'log' ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
          📋 Istoric acces
        </button>
      </div>

      {/* Formular */}
      {showFormular && tab === 'users' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-green-400 font-semibold">{editUser ? 'Editare utilizator' : 'Utilizator nou'}</h3>
            <button onClick={() => { setShowFormular(false); setEditUser(null) }}><X size={18} className="text-gray-400"/></button>
          </div>
          {eroare && <div className="bg-red-950 border border-red-700 rounded-lg p-3 mb-3 text-red-300 text-sm">{eroare}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Username *</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                disabled={!!editUser}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none disabled:opacity-50"/>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Parolă {editUser ? '(lasă gol = neschimbat)' : '*'}</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"/>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Rol</label>
              <select value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none">
                <option value="super_admin">Super Admin</option>
                <option value="operator">Operator</option>
                <option value="demo">Demo</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Nume complet</label>
              <input value={form.nume_complet} onChange={e => setForm(p => ({ ...p, nume_complet: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"/>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"/>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" checked={form.activ} onChange={e => setForm(p => ({ ...p, activ: e.target.checked }))}
                className="w-4 h-4"/>
              <label className="text-gray-400 text-sm">Cont activ</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={salveaza} disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold disabled:opacity-50">
              {loading ? 'Se salvează...' : '✅ Salvează'}
            </button>
            <button onClick={() => { setShowFormular(false); setEditUser(null) }}
              className="px-4 py-2 bg-gray-700 rounded-lg text-sm">Anulează</button>
          </div>
        </div>
      )}

      {/* Lista utilizatori */}
      {tab === 'users' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700 bg-gray-900">
                <th className="text-left py-3 px-4">Username</th>
                <th className="text-left py-3 px-4">Nume</th>
                <th className="text-left py-3 px-4">Rol</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Ultima conectare</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4 font-mono text-green-400">{u.username}</td>
                  <td className="py-3 px-4">{u.nume_complet || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      u.rol === 'super_admin' ? 'bg-purple-900 text-purple-300' :
                      u.rol === 'operator' ? 'bg-blue-900 text-blue-300' :
                      'bg-gray-700 text-gray-400'
                    }`}>{u.rol}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs ${u.activ ? 'text-green-400' : 'text-red-400'}`}>
                      {u.activ ? '✅ Activ' : '❌ Inactiv'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {u.ultima_conectare ? new Date(u.ultima_conectare).toLocaleString('ro-RO') : 'Niciodată'}
                  </td>
                  <td className="py-3 px-4">
                    {u.username !== user?.username && (
                      <button onClick={() => {
                        setEditUser(u)
                        setForm({ username: u.username, password: '', rol: u.rol, nume_complet: u.nume_complet || '', email: u.email || '', activ: u.activ })
                        setShowFormular(true)
                      }}
                        className="p-1 hover:bg-gray-700 rounded">
                        <Edit size={14} className="text-gray-400"/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Istoric acces */}
      {tab === 'log' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700 bg-gray-900">
                <th className="text-left py-3 px-4">Data/Ora</th>
                <th className="text-left py-3 px-4">Utilizator</th>
                <th className="text-left py-3 px-4">Acțiune</th>
                <th className="text-left py-3 px-4">Detalii</th>
                <th className="text-left py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody>
              {accessLog.map(log => (
                <tr key={log.id} className="border-b border-gray-700">
                  <td className="py-2 px-4 text-gray-500 text-xs">
                    {new Date(log.time).toLocaleString('ro-RO')}
                  </td>
                  <td className="py-2 px-4 font-mono text-xs">{log.username}</td>
                  <td className={`py-2 px-4 text-xs font-medium ${getActiuneStyle(log.actiune)}`}>
                    {log.actiune}
                  </td>
                  <td className="py-2 px-4 text-gray-400 text-xs">{log.detalii}</td>
                  <td className="py-2 px-4 text-gray-500 text-xs font-mono">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}