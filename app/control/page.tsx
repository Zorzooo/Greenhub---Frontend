'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Droplets, Thermometer, Wind, Sun, Activity } from 'lucide-react'

const API = 'http://localhost:8000'

const ZONE_COMPLETE = [
  { nume: 'M1N1', pozitie: 'Modul 1, Nivel 1', temp: 'M1N1 Temperatura', umid: 'M1N1 Umiditate', co2: 'M1N1 CO2', lumina: 'M1N1 Lumina' },
  { nume: 'M7N2', pozitie: 'Modul 7, Nivel 2', temp: 'M7N2 Temperatura', umid: 'M7N2 Umiditate', co2: 'M7N2 CO2', lumina: 'M7N2 Lumina' },
  { nume: 'M9N7', pozitie: 'Modul 9, Nivel 7', temp: 'M9N7 Temperatura', umid: 'M9N7 Umiditate', co2: 'M9N7 CO2', lumina: 'M9N7 Lumina' },
  { nume: 'M14N3', pozitie: 'Modul 14, Nivel 3', temp: 'M14N3 Temperatura', umid: 'M14N3 Umiditate', co2: 'M14N3 CO2', lumina: 'M14N3 Lumina' },
]

const ZONE_SIMPLE = [
  { nume: 'M2N4', pozitie: 'Modul 2, Nivel 4', temp: 'M2N4 Temperatura', umid: 'M2N4 Umiditate' },
  { nume: 'M4N7', pozitie: 'Modul 4, Nivel 7', temp: 'M4N7 Temperatura', umid: 'M4N7 Umiditate' },
  { nume: 'M10N3', pozitie: 'Modul 10, Nivel 3', temp: 'M10N3 Temperatura', umid: 'M10N3 Umiditate' },
  { nume: 'M13N5', pozitie: 'Modul 13, Nivel 5', temp: 'M13N5 Temperatura', umid: 'M13N5 Umiditate' },
  { nume: 'Ambalare', pozitie: 'Zona Ambalare', temp: 'Ambalare Temperatura', umid: 'Ambalare Umiditate' },
]

export default function Control() {
  const [plc, setPlc] = useState<any>({})
  const [dateLive, setDateLive] = useState<any[]>([])
  const [iluminat, setIluminat] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState('')
  const [irigatieInput, setIrigatieInput] = useState('03:00')
  const [confirmEmergency, setConfirmEmergency] = useState(false)

  const fetchDate = async () => {
    try {
      const [ilumR, liveR, plcR] = await Promise.all([
        axios.get(`${API}/api/iluminat`),
        axios.get(`${API}/api/date/live`),
        axios.get(`${API}/api/plc/citeste`),
      ])
      setIluminat(ilumR.data)
      setDateLive(liveR.data)
      if (plcR.data.status === 'ok') setPlc(plcR.data.valori)
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

  const getSenzor = (nume: string) => {
    const s = dateLive.find(d => d.nume === nume)
    return s?.valoare ?? '—'
  }

  const p = (cheie: string) => plc[cheie] ?? null

  const scrie = async (cheie: string, valoare: any) => {
    await axios.post(`${API}/api/plc/scrie`, { cheie, valoare })
    setTimeout(fetchDate, 500)
  }

  const scrieTemp = async (cheie: string, valoare: any, durata: number = 5000) => {
    await axios.post(`${API}/api/plc/scrie`, { cheie, valoare })
    setTimeout(async () => {
      await axios.post(`${API}/api/plc/scrie`, { cheie, valoare: false })
      fetchDate()
    }, durata)
    setTimeout(fetchDate, 500)
  }

  const formatTime = (sec: number) => {
    if (!sec || sec <= 0) return '00:00'
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const parseIrigatieInput = () => {
    const parts = irigatieInput.split(':')
    const min = parseInt(parts[0]) || 0
    const sec = parseInt(parts[1]) || 0
    return min * 60 + sec
  }

  const niveluri_tk1 = [
    { cheie: 'TK1_preaplin', label: 'OVERFLOW', danger: true },
    { cheie: 'TK1_maxim',    label: 'HIGH',     danger: false },
    { cheie: 'TK1_medium2',  label: 'MEDIUM 2', danger: false },
    { cheie: 'TK1_medium1',  label: 'MEDIUM 1', danger: false },
    { cheie: 'TK1_minim',    label: 'LOW',      danger: false },
  ]

  const niveluri_tk2 = [
    { cheie: 'TK2_preaplin', label: 'OVERFLOW', danger: true,  inversat: false },
    { cheie: 'TK2_maxim',    label: 'HIGH',     danger: false, inversat: true },
    { cheie: 'TK2_mediu',    label: 'MEDIUM',   danger: false, inversat: false },
    { cheie: 'TK2_minim',    label: 'LOW',      danger: false, inversat: false },
  ]

  const isAutoScada = p('auto_scada') === true
  const emergencyActiv = p('emergency_shutdown') === true
  const irigatiePornita = p('manual_start_irigatie_generala2') === true

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
          <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${p('manual_auto_tablou') ? 'bg-green-900 border-green-600 text-green-300' : 'bg-orange-900 border-orange-600 text-orange-300'}`}>
            {p('manual_auto_tablou') ? '🟢 Tablou AUTO' : '🟠 Tablou MANUAL'}
          </div>
          <button
            onClick={() => scrie('auto_scada', !isAutoScada)}
            className={`px-6 py-2 rounded-lg font-bold text-sm ${isAutoScada ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
          >
            {isAutoScada ? '🟢 AUTO' : '🟡 MANUAL'}
          </button>
          
          <button
            onClick={() => scrieTemp('emergency_shutdown', true, 5000)}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              emergencyActiv ? 'bg-red-700 animate-pulse' : 'bg-gray-700 hover:bg-red-800'
            }`}
          >
            🚨 EMERGENCY STOP
          </button>

        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">

        {/* COLOANA 1 — BAZINE */}
        <div className="space-y-4">

          {/* BAZIN MIXAJ TK1 */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Droplets size={16}/> Bazin Mixaj (TK1)
            </h2>
            <div className="space-y-1 mb-3">
              {niveluri_tk1.map(n => {
                const activ = p(n.cheie) === true
                return (
                  <div key={n.cheie} className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                    activ && n.danger ? 'bg-red-900 border border-red-700' :
                    activ ? 'bg-blue-900 border border-blue-700' : 'bg-gray-700'
                  }`}>
                    <span className={activ ? (n.danger ? 'text-red-300' : 'text-blue-300') : 'text-gray-400'}>
                      {n.label}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${
                      activ ? (n.danger ? 'bg-red-400 animate-pulse' : 'bg-blue-400') : 'bg-gray-600'
                    }`}/>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'EC', key: 'EC Bazin Mixaj', unit: 'mS/cm', color: 'text-purple-400' },
                { label: 'pH', key: 'pH Bazin Mixaj', unit: '', color: 'text-cyan-400' },
                { label: 'Temp', key: 'Temp Apa Mixaj', unit: '°C', color: 'text-orange-400' },
              ].map(item => (
                <div key={item.key} className="bg-gray-700 rounded p-2 text-center">
                  <div className="text-gray-500 text-xs">{item.label}</div>
                  <div className={`font-bold text-sm ${item.color}`}>{getSenzor(item.key)}<span className="text-xs"> {item.unit}</span></div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Pompa Irigație</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${p('pompa_irigatie') ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                  {p('pompa_irigatie') ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Pompa Recirculare</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${p('pompa_recirculare') ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                  {p('pompa_recirculare') ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Alimentare TK1</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${p('feedback_alimentare_TK1') ? 'bg-blue-700 text-blue-200' : 'bg-gray-700 text-gray-400'}`}>
                  {p('feedback_alimentare_TK1') ? 'ACTIV' : 'INACTIV'}
                </span>
              </div>
              <button
                onClick={() => scrie('comanda_umplere_TK1', !p('comanda_umplere_TK1'))}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                  p('comanda_umplere_TK1')
                    ? 'bg-blue-600 text-white border border-blue-400'
                    : 'bg-gray-700 hover:bg-blue-800 text-blue-300'
                }`}
              >
                💧 {p('comanda_umplere_TK1') ? 'Umplere ACTIVĂ — Oprește' : 'Umplere Manuală TK1'}
              </button>
            </div>
          </div>

          {/* BAZIN DRENAJ TK2 */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Droplets size={16}/> Bazin Drenaj (TK2)
            </h2>
            <div className="space-y-1 mb-3">
              {niveluri_tk2.map(n => {
                const activ = n.inversat ? p(n.cheie) === false : p(n.cheie) === true
                return (
                  <div key={n.cheie} className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                    activ && n.danger ? 'bg-red-900 border border-red-700' :
                    activ ? 'bg-blue-900 border border-blue-700' : 'bg-gray-700'
                  }`}>
                    <span className={activ ? (n.danger ? 'text-red-300' : 'text-blue-300') : 'text-gray-400'}>
                      {n.label}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${
                      activ ? (n.danger ? 'bg-red-400 animate-pulse' : 'bg-blue-400') : 'bg-gray-600'
                    }`}/>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'EC', key: 'EC Bazin Drenaj', unit: 'mS/cm', color: 'text-purple-400' },
                { label: 'pH', key: 'pH Bazin Drenaj', unit: '', color: 'text-cyan-400' },
                { label: 'Temp', key: 'Temp Apa Drenaj', unit: '°C', color: 'text-orange-400' },
              ].map(item => (
                <div key={item.key} className="bg-gray-700 rounded p-2 text-center">
                  <div className="text-gray-500 text-xs">{item.label}</div>
                  <div className={`font-bold text-sm ${item.color}`}>{getSenzor(item.key)}<span className="text-xs"> {item.unit}</span></div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Pompa Filtrare</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${p('pompa_filtrare') ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                  {p('pompa_filtrare') ? 'ON' : 'OFF'}
                </span>
              </div>
              <button
                onClick={() => scrie('comanda_golire_TK2', !p('comanda_golire_TK2'))}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                  p('comanda_golire_TK2')
                    ? 'bg-orange-600 text-white border border-orange-400'
                    : 'bg-gray-700 hover:bg-orange-800 text-orange-300'
                }`}
              >
                🔄 {p('comanda_golire_TK2') ? 'Golire ACTIVĂ — Oprește' : 'Golire Manuală TK2'}
              </button>
            </div>
          </div>

          {/* RECIRCULARE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Activity size={16}/> Recirculare
            </h2>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Stare pompă</span>
              <span className={`px-3 py-1 rounded text-xs font-bold ${p('pompa_recirculare') ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                {p('pompa_recirculare') ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-gray-500 text-xs mb-1">Ora Start</div>
                <select
                  className="bg-gray-700 text-white text-sm rounded px-2 py-2 w-full"
                  value={p('recirculare_ora_start') ?? 6}
                  onChange={async e => await scrie('recirculare_ora_start', parseInt(e.target.value))}
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
                  value={p('recirculare_ora_stop') ?? 23}
                  onChange={async e => await scrie('recirculare_ora_stop', parseInt(e.target.value))}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => scrie('comanda_recirculare', !p('comanda_recirculare'))}
              className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                p('comanda_recirculare')
                  ? 'bg-teal-600 text-white border border-teal-400'
                  : 'bg-gray-700 hover:bg-teal-800 text-teal-300'
              }`}
            >
              🔄 {p('comanda_recirculare') ? 'Recirculare ACTIVĂ — Oprește' : 'Pornire Manuală Recirculare'}
            </button>
            <p className="text-gray-600 text-xs mt-2">Pompa pornește automat în interval. Se oprește la irigație.</p>
          </div>

        </div>

        {/* COLOANA 2 — ZONE SENZORI */}
        <div className="space-y-4">

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Wind size={16}/> Zone Complete (T+U+CO2+Lux)
            </h2>
            <div className="space-y-2">
              {ZONE_COMPLETE.map(z => (
                <div key={z.nume} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-300 text-xs font-bold">{z.nume}</div>
                    <div className="text-gray-500 text-xs">{z.pozitie}</div>
                  </div>
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

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Thermometer size={16}/> Zone Simple (T+U)
            </h2>
            <div className="space-y-2">
              {ZONE_SIMPLE.map(z => (
                <div key={z.nume} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-gray-300 text-xs font-bold">{z.nume}</div>
                      <div className="text-gray-500 text-xs">{z.pozitie}</div>
                    </div>
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

        {/* COLOANA 3 — IRIGATIE + ELECTROVALVE */}
        <div className="space-y-4">

          {/* IRIGATIE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3">💧 Irigație Manuală</h2>

            <div className="mb-4">
              <div className="text-gray-500 text-xs mb-1">Timp irigație (MM:SS)</div>
              <input
                type="text"
                value={irigatieInput}
                onChange={e => setIrigatieInput(e.target.value)}
                onBlur={async () => {
                  const total = parseIrigatieInput()
                  if (total > 0) await scrie('irigatie_timp_setat', total)
                }}
                placeholder="03:00"
                className="bg-gray-700 text-white text-center font-bold rounded px-3 py-3 w-full text-2xl font-mono"
              />
            </div>

            <div className={`rounded-lg p-4 text-center mb-4 ${irigatiePornita ? 'bg-blue-900 border border-blue-600' : 'bg-gray-700'}`}>
              <div className="text-gray-400 text-xs mb-1">TIME LEFT</div>
              <div className={`text-3xl font-bold font-mono ${irigatiePornita ? 'text-blue-300' : 'text-gray-500'}`}>
                {formatTime(p('irigatie_time_left') || 0)}
              </div>
            </div>

            <button
              onClick={async () => {
                if (!irigatiePornita) {
                  const total = parseIrigatieInput()
                  if (total > 0) {
                    await scrie('irigatie_timp_setat', total)
                    await new Promise(r => setTimeout(r, 200))
                  }
                }
                await scrie('manual_start_irigatie_generala2', !irigatiePornita)
              }}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                irigatiePornita
                  ? 'bg-blue-800 text-blue-300 animate-pulse'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {irigatiePornita ? '⏹ STOP IRIGAȚIE' : '▶ START IRIGAȚIE'}
            </button>
            <p className="text-gray-600 text-xs mt-2 text-center">Selectează EV-urile mai jos înainte de START</p>
          </div>

          {/* ELECTROVALVE */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-3">🔧 Electrovalve</h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {Array.from({ length: 14 }, (_, i) => {
                const num = i + 1
                const cheie = `EV${num}`
                const activ = p(cheie) === true
                return (
                  <div
                    key={cheie}
                    onClick={() => scrie(cheie, !activ)}
                    className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors text-sm font-medium ${
                      activ
                        ? 'bg-green-700 border border-green-500 text-green-200'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                    }`}
                  >
                    <span>EV{num}</span>
                    <span className={`text-xs font-bold ${activ ? 'text-green-300' : 'text-gray-500'}`}>
                      {activ ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => scrieTemp('emergency_shutdown', true, 5000)}
              className="w-full py-2 rounded-lg bg-red-900 hover:bg-red-800 text-red-300 text-sm font-bold border border-red-700"
            >
              🔒 CLOSE ALL ELECTROVALVE
            </button>
          </div>

        </div>

        {/* COLOANA 4 — ILUMINAT */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <Sun size={16}/> Iluminat
            </h2>
            <div className="text-xs text-gray-500 mb-3">
              {isAutoScada ? '🟢 Mod AUTO — orele sunt active' : '🟡 Mod MANUAL — control direct activ'}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(led => {
                const cheieManual = `led${led}_manual`
                const cheieStart = `led${led}_ora_start`
                const cheieStop = `led${led}_ora_stop`
                const esteManual = p(cheieManual) === true
                const oraStart = p(cheieStart) ?? 6
                const oraStop = p(cheieStop) ?? 22

                return (
                  <div key={led} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-white text-sm font-semibold">LED{led}</div>
                      <button
                        onClick={() => scrie(cheieManual, !esteManual)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                          esteManual ? 'bg-yellow-600 text-yellow-100' : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        {esteManual ? 'MANUAL' : 'AUTO'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Ora Start</div>
                        <select
                          className="bg-gray-600 text-white text-sm rounded px-2 py-1 w-full"
                          value={oraStart}
                          onChange={async e => await scrie(cheieStart, parseInt(e.target.value))}
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
                          value={oraStop}
                          onChange={async e => await scrie(cheieStop, parseInt(e.target.value))}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {esteManual && (
                      <div className="text-center py-1 rounded text-xs font-bold bg-yellow-700 text-yellow-200">
                        💡 Mod Manual Activ
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}