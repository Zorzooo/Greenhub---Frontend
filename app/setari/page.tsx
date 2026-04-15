'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const SECTIUNI = [
  {
    titlu: '🌡️ Temperatură',
    culoare: 'text-orange-400',
    setari: [
      { cheie: 'temp_min', label: 'Temperatură minimă', unit: '°C', tip: 'number', step: '0.5' },
      { cheie: 'temp_max', label: 'Temperatură maximă', unit: '°C', tip: 'number', step: '0.5' },
    ]
  },
  {
    titlu: '💧 Umiditate',
    culoare: 'text-blue-400',
    setari: [
      { cheie: 'umid_min', label: 'Umiditate minimă', unit: '%', tip: 'number', step: '1' },
      { cheie: 'umid_max', label: 'Umiditate maximă', unit: '%', tip: 'number', step: '1' },
    ]
  },
  {
    titlu: '🌿 CO2',
    culoare: 'text-green-400',
    setari: [
      { cheie: 'co2_max', label: 'CO2 maxim', unit: 'ppm', tip: 'number', step: '10' },
    ]
  },
  {
    titlu: '⚡ EC',
    culoare: 'text-purple-400',
    setari: [
      { cheie: 'ec_min', label: 'EC minim', unit: 'mS/cm', tip: 'number', step: '0.1' },
      { cheie: 'ec_max', label: 'EC maxim', unit: 'mS/cm', tip: 'number', step: '0.1' },
    ]
  },
  {
    titlu: '🧪 pH',
    culoare: 'text-cyan-400',
    setari: [
      { cheie: 'ph_min', label: 'pH minim', unit: '', tip: 'number', step: '0.1' },
      { cheie: 'ph_max', label: 'pH maxim', unit: '', tip: 'number', step: '0.1' },
    ]
  },
  {
    titlu: '💦 Bazin Mixaj TK1',
    culoare: 'text-blue-300',
    setari: [
      { cheie: 'tk1_gol_minute', label: 'Minute fără apă până la alarmă', unit: 'min', tip: 'number', step: '1' },
    ]
  },
]

export default function Setari() {
  const [setari, setSetari] = useState<any>({})
  const [modificate, setModificate] = useState<Record<string, string>>({})
  const [salvate, setSalvate] = useState<string[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  const fetchSetari = async () => {
    const res = await axios.get(`${API}/api/setari`)
    setSetari(res.data)
  }

  useEffect(() => { fetchSetari() }, [])

  const getVal = (cheie: string) => {
    if (modificate[cheie] !== undefined) return modificate[cheie]
    return setari[cheie]?.valoare ?? ''
  }

  const salveazaSetare = async (cheie: string) => {
    setLoading(cheie)
    try {
      await axios.put(`${API}/api/setari/${cheie}`, { valoare: String(modificate[cheie] ?? setari[cheie]?.valoare) })
      setSalvate(prev => [...prev, cheie])
      setTimeout(() => setSalvate(prev => prev.filter(c => c !== cheie)), 2000)
      setModificate(prev => { const n = { ...prev }; delete n[cheie]; return n })
      fetchSetari()
    } catch (e) { console.error(e) }
    setLoading(null)
  }

  const salveazaTot = async () => {
    for (const cheie of Object.keys(modificate)) {
      await salveazaSetare(cheie)
    }
  }

  const nrModificate = Object.keys(modificate).length

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-400">⚙️ Setări Alarme</h1>
          <p className="text-gray-500 text-sm">Configurează limitele de alertare pentru senzori</p>
        </div>
        {nrModificate > 0 && (
          <button
            onClick={salveazaTot}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold"
          >
            💾 Salvează tot ({nrModificate})
          </button>
        )}
      </div>

      <div className="space-y-4">
        {SECTIUNI.map(sectiune => (
          <div key={sectiune.titlu} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h2 className={`font-semibold mb-4 ${sectiune.culoare}`}>{sectiune.titlu}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectiune.setari.map(s => {
                const esteModificat = modificate[s.cheie] !== undefined
                const esteSalvat = salvate.includes(s.cheie)
                return (
                  <div key={s.cheie}>
                    <label className="text-gray-400 text-sm mb-1 block">{s.label}</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={s.tip}
                          step={s.step}
                          value={getVal(s.cheie)}
                          onChange={e => setModificate((prev: any) => ({ ...prev, [s.cheie]: e.target.value }))}
                          className={`w-full bg-gray-700 rounded-lg px-3 py-2 text-white outline-none text-sm border ${
                            esteModificat ? 'border-yellow-600' : 'border-transparent'
                          }`}
                        />
                        {s.unit && (
                          <span className="absolute right-3 top-2 text-gray-500 text-xs">{s.unit}</span>
                        )}
                      </div>
                      {esteModificat && (
                        <button
                          onClick={() => salveazaSetare(s.cheie)}
                          disabled={loading === s.cheie}
                          className="px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-bold"
                        >
                          {loading === s.cheie ? '...' : esteSalvat ? '✅' : '💾'}
                        </button>
                      )}
                      {esteSalvat && !esteModificat && (
                        <span className="px-3 py-2 text-green-400 text-xs">✅</span>
                      )}
                    </div>
                    <div className="text-gray-600 text-xs mt-1">{setari[s.cheie]?.descriere}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}