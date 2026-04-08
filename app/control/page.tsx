'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { ArrowLeft, Droplets, Thermometer, Wind, Sun, Activity } from 'lucide-react'
import Link from 'next/link'

const API = 'http://localhost:8000'

const ZONE_COMPLETE = [
  { nume: 'Zona 1', temp: 'zona1_temperatura', umid: 'zona1_umiditate', co2: 'zona1_co2', lumina: 'zona1_lumina' },
  { nume: 'Zona 2', temp: 'zona2_temperatura', umid: 'zona2_umiditate', co2: 'zona2_co2', lumina: 'zona2_lumina' },
  { nume: 'Zona 3', temp: 'zona3_temperatura', umid: 'zona3_umiditate', co2: 'zona3_co2', lumina: 'zona3_lumina' },
  { nume: 'Zona 4', temp: 'zona4_temperatura', umid: 'zona4_umiditate', co2: 'zona4_co2', lumina: 'zona4_lumina' },
]

const ZONE_SIMPLE = [
  { nume: 'Zona 5', temp: 'zona5_temperatura', umid: 'zona5_umiditate' },
  { nume: 'Zona 6', temp: 'zona6_temperatura', umid: 'zona6_umiditate' },
  { nume: 'Zona 7', temp: 'zona7_temperatura', umid: 'zona7_umiditate' },
  { nume: 'Zona 8', temp: 'zona8_temperatura', umid: 'zona8_umiditate' },
  { nume: 'Zona Ambalare', temp: 'zona_ambalare_temperatura', umid: 'zona_ambalare_umiditate' },
]

export default function Control() {
  const [dateLive, setDateLive] = useState<any[]>([])
  const [electrovalve, setElectrovalve] = useState<any[]>([])
  const [iluminat, setIluminat] = useState<any[]>([])
  const [setari, setSetari] = useState<any>({})
  const [lastUpdate, setLastUpdate] = useState('')
  const [irigatieTimp, setIrigatieTimp] = useState({ minute: 3, secunde: 0 })
  const [irigatiePornita, setIrigatiePornita] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [confirmEmergency, setConfirmEmergency] = useState(false)

  const fetchDate = async () => {
    try {
      const [evR, ilumR, liveR, setariR] = await Promise.all([
        axios.get(`${API}/api/electrovalve`),
        axios.get(`${API}/api/iluminat`),
        axios.get(`${API}/api/date/live`),
        axios.get(`${API}/api/setari`),
      ])
      setElectrovalve(evR.data)
      setIluminat(ilumR.data)
      setDateLive(liveR.data)
      setSetari(setariR.data)
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
    { key: 'mixaj_preaplin', label: 'OVERFLOW' },
    { key: 'mixaj_high', label: 'HIGH' },
    { key: 'mixaj_med2', label: 'MEDIUM 2' },
    { key: 'mixaj_med1', label: 'MEDIUM 1' },
    { key: 'mixaj_min', label: 'LOW' },
  ]

  const niveluri_drenaj = [
    { key: 'drenaj_overflow', label: 'OVERFLOW' },
    { key: 'drenaj_high', label: 'HIGH' },
    { key: 'drenaj_med', label: 'MEDIUM' },
    { key: 'drenaj_min', label: 'LOW' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-green-400">⚙️ Panou Control</h1>
          <p className="text-gray-400 text-sm">Actualizat: {lastUpdate}</p>
        </div>
        <div className="flex gap-3">
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

          {/* MAIN TANK */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Droplets size={16}/> Main Tank
            </h2>
            <div className="space-y-1 mb-3">
              {niveluri_mixaj.map(n => {
                const activ = getSenzor(n.key) === 1 || getSenzor(n.key) === '1'
                return (
                  <div key={n.key} className={`flex items-center justify-between px-3 py-2 rounded text-sm ${activ ? 'bg-blue-900 border border-blue-700' : 'bg-gray-700'}`}>
                    <span className={activ ? 'text-blue-300' : 'text-gray-400'}>{n.label}</span>
                    <div className={`w-3 h-3 rounded-full ${activ ? 'bg-green-400' : 'bg-red-500'}`}/>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Filling Pump</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getSenzor('filling_pump_stare') === 1 ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                  {getSenzor('filling_pump_stare') === 1 ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'EC', key: 'ec_bazin_mixaj', unit: 'mS/cm', color: 'text-purple-400' },
                  { label: 'pH', key: 'ph_bazin_mixaj', unit: '', color: 'text-cyan-400' },
                  { label: 'Temp', key: 'temp_apa_mixaj', unit: '°C', color: 'text-orange-400' },
                ].map(item => (
                  <div key={item.key} className="bg-gray-700 rounded p-2 text-center">
                    <div className="text-gray-500 text-xs">{item.label}</div>
                    <div className={`font-bold text-sm ${item.color}`}>{getSenzor(item.key)} <span className="text-xs">{item.unit}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DRAINAGE TANK */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Droplets size={16}/> Drainage Tank
            </h2>
            <div className="space-y-1 mb-3">
              {niveluri_drenaj.map(n => {
                const activ = getSenzor(n.key) === 1 || getSenzor(n.key) === '1'
                return (
                  <div key={n.key} className={`flex items-center justify-between px-3 py-2 rounded text-sm ${activ ? 'bg-blue-900 border border-blue-700' : 'bg-gray-700'}`}>
                    <span className={activ ? 'text-blue-300' : 'text-gray-400'}>{n.label}</span>
                    <div className={`w-3 h-3 rounded-full ${activ ? 'bg-green-400' : 'bg-red-500'}`}/>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Pompa Filtrare</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getSenzor('pompa_filtrare_stare') === 1 ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                  {getSenzor('pompa_filtrare_stare') === 1 ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'EC', key: 'ec_bazin_drenaj', unit: 'mS/cm', color: 'text-purple-400' },
                  { label: 'pH', key: 'ph_bazin_drenaj', unit: '', color: 'text-cyan-400' },
                  { label: 'Temp', key: 'temp_apa_drenaj', unit: '°C', color: 'text-orange-400' },
                ].map(item => (
                  <div key={item.key} className="bg-gray-700 rounded p-2 text-center">
                    <div className="text-gray-500 text-xs">{item.label}</div>
                    <div className={`font-bold text-sm ${item.color}`}>{getSenzor(item.key)} <span className="text-xs">{item.unit}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RECIRCULARE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Activity size={16}/> Recirculare
            </h2>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Stare</span>
              <span className={`px-3 py-1 rounded text-xs font-bold ${getSenzor('pompa_recirculare_stare') === 1 ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                {getSenzor('pompa_recirculare_stare') === 1 ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            <p className="text-gray-600 text-xs mt-2">Pompa pornește automat în interval. Se oprește la irigație.</p>
          </div>

        </div>

        {/* COLOANA 2 — ZONE SENZORI */}
        <div className="space-y-4">

          {/* ZONE COMPLETE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Wind size={16}/> Zone Complete
            </h2>
            <div className="space-y-2">
              {ZONE_COMPLETE.map(z => (
                <div key={z.nume} className="bg-gray-700 rounded-lg p-3">
                  <div className="text-gray-300 text-xs font-semibold mb-2">{z.nume}</div>
                  <div className="grid grid-cols-4 gap-2 text-center">
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

          {/* ZONE SIMPLE + AMBALARE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Thermometer size={16}/> Zone Simple + Ambalare
            </h2>
            <div className="space-y-2">
              {ZONE_SIMPLE.map(z => (
                <div key={z.nume} className={`bg-gray-700 rounded-lg p-3 ${z.nume === 'Zona Ambalare' ? 'border border-gray-600' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-xs font-semibold">{z.nume}</span>
                    <div className="flex gap-4">
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

        {/* COLOANA 3 — IRIGATIE */}
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
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Sun size={16}/> Iluminat
            </h2>
            <div className="space-y-3">
              {iluminat.map((g, idx) => (
                <div key={g.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-3">
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