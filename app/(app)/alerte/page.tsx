'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const CATEGORII = ['toate', 'temperatura', 'umiditate', 'co2', 'bazin', 'productie', 'sistem']

export default function Alerte() {
  const [alerte, setAlerte] = useState<any[]>([])
  const [filtruCategorie, setFiltruCategorie] = useState('toate')
  const [filtruRezolvat, setFiltruRezolvat] = useState<'toate' | 'active' | 'rezolvate'>('active')
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchAlerte = async () => {
    const res = await axios.get(`${API}/api/alerte?limit=200`)
    setAlerte(res.data)
    setLastUpdate(new Date().toLocaleTimeString('ro-RO'))
  }

  useEffect(() => {
    fetchAlerte()
    const interval = setInterval(fetchAlerte, 15000)
    return () => clearInterval(interval)
  }, [])

  const rezolva = async (id: number) => {
    await axios.put(`${API}/api/alerte/${id}/rezolva`)
    fetchAlerte()
  }

  const rezolvaToate = async () => {
    const active = alerteFiltrate.filter(a => !a.rezolvat)
    for (const a of active) {
      await axios.put(`${API}/api/alerte/${a.id}/rezolva`)
    }
    fetchAlerte()
  }

  const alerteFiltrate = alerte.filter(a => {
    if (filtruCategorie !== 'toate' && a.categorie !== filtruCategorie) return false
    if (filtruRezolvat === 'active' && a.rezolvat) return false
    if (filtruRezolvat === 'rezolvate' && !a.rezolvat) return false
    return true
  })

  const nrActive = alerte.filter(a => !a.rezolvat).length

  const getSeveritateStyle = (sev: string) => {
    switch (sev) {
      case 'red': return 'bg-red-950 border-red-700 text-red-300'
      case 'yellow': return 'bg-yellow-950 border-yellow-700 text-yellow-300'
      default: return 'bg-gray-800 border-gray-700 text-gray-300'
    }
  }

  const getSeveritateIcon = (sev: string) => {
    switch (sev) {
      case 'red': return '🔴'
      case 'yellow': return '🟡'
      default: return '🔵'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-red-400">🚨 Alerte</h1>
          <p className="text-gray-500 text-sm">Actualizat: {lastUpdate} — {nrActive} active</p>
        </div>
        {nrActive > 0 && filtruRezolvat === 'active' && (
          <button
            onClick={rezolvaToate}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium"
          >
            ✅ Rezolvă toate ({nrActive})
          </button>
        )}
      </div>

      {/* Filtre */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['active', 'toate', 'rezolvate'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltruRezolvat(f)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize ${
                filtruRezolvat === f ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f === 'active' ? `Active (${nrActive})` : f === 'rezolvate' ? 'Rezolvate' : 'Toate'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 flex-wrap">
          {CATEGORII.map(c => (
            <button
              key={c}
              onClick={() => setFiltruCategorie(c)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize ${
                filtruCategorie === c ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Lista alerte */}
      {alerteFiltrate.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-lg">Nicio alertă {filtruRezolvat === 'active' ? 'activă' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerteFiltrate.map(alerta => (
            <div
              key={alerta.id}
              className={`rounded-xl p-4 border flex items-start justify-between gap-3 ${
                alerta.rezolvat ? 'bg-gray-900 border-gray-800 opacity-60' : getSeveritateStyle(alerta.severitate)
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-lg mt-0.5">{getSeveritateIcon(alerta.severitate)}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{alerta.mesaj}</div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs opacity-60 capitalize">{alerta.categorie}</span>
                    <span className="text-xs opacity-60">
                      {new Date(alerta.time).toLocaleString('ro-RO')}
                    </span>
                    {alerta.rezolvat && (
                      <span className="text-xs text-green-500">✅ Rezolvată</span>
                    )}
                  </div>
                </div>
              </div>
              {!alerta.rezolvat && (
                <button
                  onClick={() => rezolva(alerta.id)}
                  className="px-3 py-1 bg-gray-700 hover:bg-green-700 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                >
                  Rezolvă
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}