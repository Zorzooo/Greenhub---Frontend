'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Droplets, Thermometer, Wind, Sun, Activity } from 'lucide-react'

const API = 'http://localhost:8000'

const ZONE_COMPLETE = [
  {
    nume: 'M1N1 — Modul 1, Nivel 1',
    pozitie: 'M1N1',
    temp: 'M1N1 Temperatura',
    umid: 'M1N1 Umiditate',
    co2: 'M1N1 CO2',
    lumina: 'M1N1 Lumina',
    tip: 'nou'
  },
  {
    nume: 'M7N2 — Modul 7, Nivel 2',
    pozitie: 'M7N2',
    temp: 'M7N2 Temperatura',
    umid: 'M7N2 Umiditate',
    co2: 'M7N2 CO2',
    lumina: 'M7N2 Lumina',
    tip: 'nou'
  },
  {
    nume: 'M9N7 — Modul 9, Nivel 7',
    pozitie: 'M9N7',
    temp: 'M9N7 Temperatura',
    umid: 'M9N7 Umiditate',
    co2: 'M9N7 CO2',
    lumina: 'M9N7 Lumina',
    tip: 'nou'
  },
  {
    nume: 'M14N3 — Modul 14, Nivel 3',
    pozitie: 'M14N3',
    temp: 'M14N3 Temperatura',
    umid: 'M14N3 Umiditate',
    co2: 'M14N3 CO2',
    lumina: 'M14N3 Lumina',
    tip: 'nou'
  },
]

const ZONE_SIMPLE = [
  { nume: 'M2N4 — Modul 2, Nivel 4', pozitie: 'M2N4', temp: 'M2N4 Temperatura', umid: 'M2N4 Umiditate', tip: 'existent' },
  { nume: 'M4N7 — Modul 4, Nivel 7', pozitie: 'M4N7', temp: 'M4N7 Temperatura', umid: 'M4N7 Umiditate', tip: 'existent' },
  { nume: 'M10N3 — Modul 10, Nivel 3', pozitie: 'M10N3', temp: 'M10N3 Temperatura', umid: 'M10N3 Umiditate', tip: 'existent' },
  { nume: 'M13N5 — Modul 13, Nivel 5', pozitie: 'M13N5', temp: 'M13N5 Temperatura', umid: 'M13N5 Umiditate', tip: 'existent' },
  { nume: 'Zona Ambalare', pozitie: 'Ambalare', temp: 'Ambalare Temperatura', umid: 'Ambalare Umiditate', tip: 'nou' },
]

export default function Control() {
  const [dateLive, setDateLive] = useState<any[]>([])
  const [electrovalve, setElectrovalve] = useState<any[]>([])
  const [iluminat, setIluminat] = useState<any[]>([])
  const [setari, setSetari] = useState<any>({})
  const [pompe, setPompe] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState('')
  const [irigatieTimp, setIrigatieTimp] = useState({ minute: 3, secunde: 0 })
  const [irigatiePornita, setIrigatiePornita] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [confirmEmergency, setConfirmEmergency] = useState(false)

  const fetchDate = async () => {
    try {
      const [evR, ilumR, liveR, setariR, pompeR] = await Promise.all([
        axios.get(`${API}/api/electrovalve`),
        axios.get(`${API}/api/iluminat`),
        axios.get(`${API}/api/date/live`),
        axios.get(`${API}/api/setari`),
        axios.get(`${API}/api/pompe`),
      ])
      setElectrovalve(evR.data)
      setIluminat(ilumR.data)
      setDateLive(liveR.data)
      setSetari(setariR.data)
      setPompe(pompeR.data)
      setLastUpdate(new Date().toLocaleTimeString('ro-RO'))
    } catch (e) {
      console.error('Eroare:', e)
    }
  }

  useEffect(() => {
    fetchDate()
    const interval = setInterval(fetchDate, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!irigatiePornita || timeLeft <= 0) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setIrigatiePornita(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [irigatiePornita, timeLeft])

  const getSenzor = (nume: string) => {
    const s = dateLive.find(d => d.nume === nume)
    return s?.valoare ?? '—'
  }

  const getPompa = (tip: string) => {
    const p = pompe.find(p => p.tip === tip)
    return p?.stare_curenta ?? false
  }

  const modGeneral = setari['mod_general']?.valoare || 'auto'
  const emergencyActiv = setari['emergency_shutdown']?.valoare === 'true'

  const toggleMod = async () => {
    const nou = modGeneral === 'auto' ? 'manual' : 'auto'
    await axios.put(`${API}/api/setari/mod_general`, { valoare: nou })
    fetchDate()
  }

  const triggerEmergency = async () => {
    if (!confirmEmergency) { setConfirmEmergency(true); return }
    await axios.put(`${API}/api/setari/emergency_shutdown`, { valoare: 'true' })
    setConfirmEmergency(false)
    setIrigatiePornita(false)
    setTimeLeft(0)
    fetchDate()
  }

  const updateIluminat = async (id: number, field: string, val: any) => {
    const g = iluminat.find(g => g.id === id)
    if (!g) return
    await axios.put(`${API}/api/iluminat/${id}`, { ...g, [field]: val })
    fetchDate()
  }

  const startIrigatie = () => {
    const total = irigatieTimp.minute * 60 + irigatieTimp.secunde
    if (total <= 0) return
    setTimeLeft(total)
    setIrigatiePornita(true)
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const niveluri_mixaj = [
    { key: 'TK1_preaplin', label: 'OVERFLOW', db_name: 'TK1 Preaplin' },
  ]

  const niveluri_drenaj = [
    { key: 'TK2_preaplin', label: 'OVERFLOW', db_name: 'TK2 Preaplin' },
    { key: 'TK2_maxim', label: 'HIGH', db_name: 'TK2 Maxim' },
    { key: 'TK2_mediu', label: 'MEDIUM', db_name: 'TK2 Mediu' },
    { key: 'TK2_minim', label: 'LOW', db_name: 'TK2 Minim' },
  ]

  // Citim starea bazinelor direct din dateLive
  const getBazin = (db_name: string) => {
    const s = dateLive.find(d => d.nume === db_name)
    if (!s) return false
    return s.valoare === 1 || s.valoare === true || s.valoare === '1' || s.valoare === 'True'
  }

  const autoScada = dateLive.find(d => d.nume === 'auto_scada')
  const isAutoScada = autoScada?.valoare === 1 || autoScada?.valoare === true

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-green-400">⚙️ Panou Control</h1>
          <p className="text-gray-400 text-sm">Actualizat: {lastUpdate}</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${isAutoScada ? 'bg-green-900 border-green-600 text-green-300' : 'bg-yellow-900 border-yellow-600 text-yellow-300'}`}>
            {isAutoScada ? '🟢 SCADA AUTO' : '🟡 SCADA MANUAL'}
          </div>
          <button
            onClick={toggleMod}
            className={`px-6 py-2 rounded-lg font-bold text-sm ${modGeneral === 'auto' ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
          >
            {modGeneral === 'auto' ? '🟢 AUTO' : '🟡 MANUAL'}
          </button>
          <button
            onClick={triggerEmergency}
            onMouseLeave={() => setConfirmEmergency(false)}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              confirmEmergency ? 'bg-red-500 animate-pulse scale-105' :
              emergencyActiv ? 'bg-red-700 animate-pulse' : 'bg-gray-700 hover:bg-red-800'
            }`}
          >
            {confirmEmergency ? '⚠️ CONFIRMA STOP!' : '🚨 EMERGENCY STOP'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">

        {/* COLOANA 1 — BAZINE */}
        <div className="space-y-4">

          {/* MAIN TANK — TK1 Bazin Mixaj */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Droplets size={16}/> Bazin Mixaj (TK1)
            </h2>
            <div className="space-y-1 mb-3">
              {niveluri_mixaj.map(n => {
                const activ = getBazin(n.db_name)
                return (
                  <div key={n.key} className={`flex items-center justify-between px-3 py-2 rounded text-sm ${activ ? 'bg-red-900 border border-red-700' : 'bg-gray-700'}`}>
                    <span className={activ ? 'text-red-300' : 'text-gray-400'}>{n.label}</span>
                    <div className={`w-3 h-3 rounded-full ${activ ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`}/>
                  </div>
                )
              })}
            </div>

            {/* Pompe TK1 */}
            <div className="border-t border-gray-700 pt-3 space-y-2">
              {[
                { label: 'Pompa Irigație', tip: 'irigatie', key: 'pompa_irigatie' },
                { label: 'Alimentare TK1', tip: 'alimentare', key: 'feedback_alimentare_TK1' },
              ].map(p => {
                const activ = pompe.find(pm => pm.tip === p.tip)?.stare_curenta ||
                  getBazin('Feedback Alimentare TK1')
                return (
                  <div key={p.key} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{p.label}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${activ ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                      {activ ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* EC, pH, Temp apa — placeholder pana adaugi senzorii */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'EC', key: 'EC Bazin Mixaj', unit: 'mS/cm', color: 'text-purple-400' },
                { label: 'pH', key: 'pH Bazin Mixaj', unit: '', color: 'text-cyan-400' },
                { label: 'Temp', key: 'Temp Apa Mixaj', unit: '°C', color: 'text-orange-400' },
              ].map(item => (
                <div key={item.key} className="bg-gray-700 rounded p-2 text-center">
                  <div className="text-gray-500 text-xs">{item.label}</div>
                  <div className={`font-bold text-sm ${item.color}`}>
                    {getSenzor(item.key)} <span className="text-xs">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Comenzi manuale TK1 */}
            <div className="mt-3 space-y-2">
              <button
                onClick={() => axios.post(`${API}/api/ev/on`, { ev_id: 'fill_tank' }).then(fetchDate)}
                className="w-full py-2 bg-blue-800 hover:bg-blue-700 rounded-lg text-xs font-medium text-blue-200"
              >
                💧 Umplere Manuală TK1
              </button>
            </div>
          </div>

          {/* DRAINAGE TANK — TK2 Bazin Drenaj */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Droplets size={16}/> Bazin Drenaj (TK2)
            </h2>
            <div className="space-y-1 mb-3">
              {niveluri_drenaj.map(n => {
                const activ = getBazin(n.db_name)
                return (
                  <div key={n.key} className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                    n.label === 'OVERFLOW' && activ ? 'bg-red-900 border border-red-700' :
                    activ ? 'bg-blue-900 border border-blue-700' : 'bg-gray-700'
                  }`}>
                    <span className={activ ? (n.label === 'OVERFLOW' ? 'text-red-300' : 'text-blue-300') : 'text-gray-400'}>
                      {n.label}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${
                      activ ? (n.label === 'OVERFLOW' ? 'bg-red-400 animate-pulse' : 'bg-blue-400') : 'bg-gray-500'
                    }`}/>
                  </div>
                )
              })}
            </div>

            {/* Pompe TK2 */}
            <div className="border-t border-gray-700 pt-3 space-y-2">
              {[
                { label: 'Pompa Filtrare', tip: 'filtrare' },
                { label: 'Pompa Recirculare', tip: 'recirculare' },
              ].map(p => {
                const activ = pompe.find(pm => pm.tip === p.tip)?.stare_curenta
                return (
                  <div key={p.tip} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{p.label}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${activ ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                      {activ ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'EC', key: 'EC Bazin Drenaj', unit: 'mS/cm', color: 'text-purple-400' },
                { label: 'pH', key: 'pH Bazin Drenaj', unit: '', color: 'text-cyan-400' },
                { label: 'Temp', key: 'Temp Apa Drenaj', unit: '°C', color: 'text-orange-400' },
              ].map(item => (
                <div key={item.key} className="bg-gray-700 rounded p-2 text-center">
                  <div className="text-gray-500 text-xs">{item.label}</div>
                  <div className={`font-bold text-sm ${item.color}`}>
                    {getSenzor(item.key)} <span className="text-xs">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Comenzi manuale TK2 */}
            <div className="mt-3 space-y-2">
              <button
                onClick={() => axios.post(`${API}/api/ev/on`, { ev_id: 'drain_tank' }).then(fetchDate)}
                className="w-full py-2 bg-orange-800 hover:bg-orange-700 rounded-lg text-xs font-medium text-orange-200"
              >
                🔄 Golire Manuală TK2
              </button>
            </div>
          </div>

          {/* RECIRCULARE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Activity size={16}/> Recirculare
            </h2>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Stare</span>
              <span className={`px-3 py-1 rounded text-xs font-bold ${pompe.find(p => p.tip === 'recirculare')?.stare_curenta ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                {pompe.find(p => p.tip === 'recirculare')?.stare_curenta ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <div className="text-gray-500 text-xs mb-1">Ora Start</div>
                <select
                  className="bg-gray-700 text-white text-sm rounded px-2 py-2 w-full"
                  defaultValue={setari['recirculare_ora_start']?.valoare || '6'}
                  onChange={e => axios.put(`${API}/api/setari/recirculare_ora_start`, { valoare: e.target.value })}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Ora Stop</div>
                <select
                  className="bg-gray-700 text-white text-sm rounded px-2 py-2 w-full"
                  defaultValue={setari['recirculare_ora_stop']?.valoare || '23'}
                  onChange={e => axios.put(`${API}/api/setari/recirculare_ora_stop`, { valoare: e.target.value })}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => axios.post(`${API}/api/ev/on`, { ev_id: 'recirculare' }).then(fetchDate)}
              className="w-full py-2 bg-teal-800 hover:bg-teal-700 rounded-lg text-xs font-medium text-teal-200 mt-2"
            >
              🔄 Pornire Manuală Recirculare
            </button>
            <p className="text-gray-600 text-xs mt-2">Pompa pornește automat în interval. Se oprește la irigație.</p>
          </div>

        </div>

        {/* COLOANA 2 — ZONE SENZORI CU POZITII REALE */}
        <div className="space-y-4">

          {/* ZONE COMPLETE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Wind size={16}/> Zone Complete (T+U+CO2+Lux)
            </h2>
            <div className="space-y-2">
              {ZONE_COMPLETE.map(z => (
                <div key={z.pozitie} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-300 text-xs font-semibold">{z.pozitie}</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${z.tip === 'nou' ? 'bg-green-900 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                      {z.tip === 'nou' ? 'NOU' : 'EXISTENT'}
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs mb-2">{z.nume.split('—')[1]?.trim()}</div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div>
                      <div className="text-gray-500 text-xs">Temp</div>
                      <div className="text-orange-400 font-bold text-sm">{getSenzor(z.temp)}°C</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Umid</div>
                      <div className="text-blue-400 font-bold text-sm">{getSenzor(z.umid)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">CO2</div>
                      <div className="text-green-400 font-bold text-sm">{getSenzor(z.co2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Lux</div>
                      <div className="text-yellow-400 font-bold text-sm">{getSenzor(z.lumina)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ZONE SIMPLE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Thermometer size={16}/> Zone Simple (T+U)
            </h2>
            <div className="space-y-2">
              {ZONE_SIMPLE.map(z => (
                <div key={z.pozitie} className={`bg-gray-700 rounded-lg p-3 ${z.pozitie === 'Ambalare' ? 'border border-gray-600' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-gray-300 text-xs font-semibold">{z.pozitie}</div>
                      <div className="text-gray-500 text-xs">{z.nume.split('—')[1]?.trim() || z.nume}</div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Temp</div>
                        <div className="text-orange-400 font-bold">{getSenzor(z.temp)}°C</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Umid</div>
                        <div className="text-blue-400 font-bold">{getSenzor(z.umid)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLOANA 3 — IRIGATIE + ELECTROVALVE */}
        <div className="space-y-4">

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3">💧 Irigație Manuală</h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-gray-500 text-xs mb-1">Minute</div>
                <input
                  type="number" min={0} max={60}
                  value={irigatieTimp.minute}
                  onChange={e => setIrigatieTimp(prev => ({ ...prev, minute: parseInt(e.target.value) || 0 }))}
                  className="bg-gray-700 text-white text-center font-bold rounded px-2 py-2 w-full text-lg"
                />
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Secunde</div>
                <input
                  type="number" min={0} max={59}
                  value={irigatieTimp.secunde}
                  onChange={e => setIrigatieTimp(prev => ({ ...prev, secunde: parseInt(e.target.value) || 0 }))}
                  className="bg-gray-700 text-white text-center font-bold rounded px-2 py-2 w-full text-lg"
                />
              </div>
            </div>

            <div className={`rounded-lg p-4 text-center mb-4 ${irigatiePornita ? 'bg-blue-900 border border-blue-600' : 'bg-gray-700'}`}>
              <div className="text-gray-400 text-xs mb-1">TIME LEFT</div>
              <div className={`text-3xl font-bold font-mono ${irigatiePornita ? 'text-blue-300' : 'text-gray-500'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            <button
              onClick={startIrigatie}
              disabled={irigatiePornita}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                irigatiePornita
                  ? 'bg-blue-800 text-blue-300 cursor-not-allowed animate-pulse'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {irigatiePornita ? '💧 IRIGAȚIE ACTIVĂ...' : '▶ START IRIGAȚIE'}
            </button>

            {irigatiePornita && (
              <button
                onClick={() => { setIrigatiePornita(false); setTimeLeft(0) }}
                className="w-full mt-2 py-2 rounded-lg font-bold text-sm bg-red-800 hover:bg-red-700 text-red-200"
              >
                ⏹ STOP
              </button>
            )}
            <p className="text-gray-600 text-xs mt-2 text-center">Selectează EV-urile mai jos înainte de START</p>
          </div>

          {/* ELECTROVALVE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3">🔧 Electrovalve</h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {electrovalve.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => axios.post(`${API}/api/ev/on`, { ev_id: ev.id }).then(fetchDate)}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors text-sm font-medium ${
                    ev.stare_curenta
                      ? 'bg-green-700 border border-green-500 text-green-200'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                  }`}
                >
                  <span>EV{ev.numar}</span>
                  <span className={`text-xs font-bold ${ev.stare_curenta ? 'text-green-300' : 'text-gray-500'}`}>
                    {ev.stare_curenta ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => axios.post(`${API}/api/ev/close_all`).then(fetchDate)}
              className="w-full py-2 rounded-lg bg-red-900 hover:bg-red-800 text-red-300 text-sm font-bold border border-red-700"
            >
              🔒 CLOSE ALL ELECTROVALVE
            </button>
          </div>

        </div>

        {/* COLOANA 4 — ILUMINAT */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-1 flex items-center gap-2">
              <Sun size={16}/> Iluminat
            </h2>
            <div className="text-xs text-gray-500 mb-3">
              {isAutoScada ? '🟢 Mod AUTO — orele sunt active' : '🟡 Mod MANUAL — control direct activ'}
            </div>
            <div className="space-y-3">
              {iluminat.map((g, idx) => (
                <div key={g.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="text-white text-sm font-semibold">LED{idx + 1}</div>
                      <div className="text-gray-500 text-xs">{g.nume}</div>
                    </div>
                    <button
                      onClick={() => updateIluminat(g.id, 'manual_override', !g.manual_override)}
                      className={`px-3 py-1 rounded text-xs font-bold ${g.manual_override ? 'bg-yellow-600 text-yellow-100' : 'bg-gray-600 text-gray-300'}`}
                    >
                      {g.manual_override ? 'MANUAL' : 'AUTO'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Ora Start</div>
                      <select
                        className="bg-gray-600 text-white text-sm rounded px-2 py-1 w-full"
                        value={parseInt(g.ora_start)}
                        onChange={e => updateIluminat(g.id, 'ora_start', `${e.target.value}:00`)}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Ora Stop</div>
                      <select
                        className="bg-gray-600 text-white text-sm rounded px-2 py-1 w-full"
                        value={parseInt(g.ora_stop)}
                        onChange={e => updateIluminat(g.id, 'ora_stop', `${e.target.value}:00`)}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {g.manual_override && (
                    <button
                      onClick={() => updateIluminat(g.id, 'stare_manuala', !g.stare_manuala)}
                      className={`w-full py-1 rounded text-xs font-bold ${g.stare_manuala ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-600 text-gray-400'}`}
                    >
                      {g.stare_manuala ? '💡 ON' : '⚫ OFF'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}