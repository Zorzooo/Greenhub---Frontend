'use client'

import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { MessageSquare, X, History, CheckCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'

const API = 'http://localhost:8000'

const PRAGURI: any = {
  temperatura: { min: 19, max: 28, unitate: '°C', label: 'Temperatură', culoare: '#f97316' },
  umiditate: { min: 40, max: 70, unitate: '%', label: 'Umiditate', culoare: '#60a5fa' },
  ec: { min: 1.2, max: 2.6, unitate: 'mS/cm', label: 'EC', culoare: '#a78bfa' },
  ph: { min: 5.5, max: 6.5, unitate: '', label: 'pH', culoare: '#00d4aa' },
  co2: { min: 400, max: 1200, unitate: 'ppm', label: 'CO2', culoare: '#34d399' },
}

function Gauge({ valoare, min, max, unitate, label }: any) {
  const val = parseFloat(valoare) || 0
  const pct = Math.min(Math.max((val - min) / (max - min), 0), 1)
  const cx = 80, cy = 80, r = 60
  const startAngle = -135 * Math.PI / 180
  const endAngle = 135 * Math.PI / 180
  const arcEndAngle = (-135 + pct * 270) * Math.PI / 180
  const sx = cx + r * Math.cos(startAngle)
  const sy = cy + r * Math.sin(startAngle)
  const ex = cx + r * Math.cos(endAngle)
  const ey = cy + r * Math.sin(endAngle)
  const vx = cx + r * Math.cos(arcEndAngle)
  const vy = cy + r * Math.sin(arcEndAngle)
  const largeArc = pct > 0.5 ? 1 : 0
  const isEmpty = valoare === '—' || valoare === undefined
  const inRange = val >= min && val <= max
  const statusColor = isEmpty ? '#4b5563' : inRange ? '#22c55e' : '#ef4444'

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col items-center">
      <div className="text-gray-400 text-sm font-medium mb-1">{label}</div>
      <svg width="160" height="110" viewBox="0 0 160 110">
        <path d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`}
          fill="none" stroke="#374151" strokeWidth="10" strokeLinecap="round"/>
        {!isEmpty && pct > 0 && (
          <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${vx} ${vy}`}
            fill="none" stroke={statusColor} strokeWidth="10" strokeLinecap="round"/>
        )}
        <text x="18" y="105" fill="#6b7280" fontSize="9" textAnchor="middle">{min}</text>
        <text x="142" y="105" fill="#6b7280" fontSize="9" textAnchor="middle">{max}</text>
        <text x="80" y="75" fill={statusColor} fontSize="22" fontWeight="bold" textAnchor="middle">
          {isEmpty ? '—' : val.toFixed(1)}
        </text>
        <text x="80" y="90" fill="#9ca3af" fontSize="10" textAnchor="middle">{unitate}</text>
        <circle cx="80" cy="100" r="4" fill={statusColor}/>
      </svg>
      <div className={`text-xs font-medium mt-1 ${isEmpty ? 'text-gray-600' : inRange ? 'text-green-400' : 'text-red-400'}`}>
        {isEmpty ? 'Fără date' : inRange ? 'În parametri' : 'În afara parametrilor!'}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [dateLive, setDateLive] = useState<any[]>([])
  const [pompe, setPompe] = useState<any[]>([])
  const [alerte, setAlerte] = useState<any[]>([])
  const [chat, setChat] = useState<{ rol: string, mesaj: string, time?: string, id?: number }[]>([])
  const [mesaj, setMesaj] = useState('')
  const [chatDeschis, setChatDeschis] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')
  const [savedToJurnal, setSavedToJurnal] = useState<number[]>([])
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const scrollJos = () => {
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const fetchDate = async () => {
    try {
      const [liveR, pompeR, alerteR] = await Promise.all([
        axios.get(`${API}/api/date/live`),
        axios.get(`${API}/api/pompe`),
        axios.get(`${API}/api/alerte`),
      ])
      setDateLive(liveR.data)
      setPompe(pompeR.data)
      setAlerte(alerteR.data)
      setLastUpdate(new Date().toLocaleTimeString('ro-RO'))
    } catch (e) { console.error(e) }
  }

  const incarcaIstoricChat = async () => {
    try {
      const res = await axios.get(`${API}/api/chat/istoric`)
      const mesaje = res.data.reverse().slice(-20).map((m: any) => ({
        rol: m.rol,
        mesaj: m.mesaj,
        time: new Date(m.time).toLocaleString('ro-RO'),
        id: m.id
      }))
      setChat(mesaje)
      scrollJos()
    } catch (e) { }
  }

  const deschideChat = () => {
    setChatDeschis(true)
    incarcaIstoricChat()
  }

  useEffect(() => {
    fetchDate()
    const interval = setInterval(fetchDate, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (chatDeschis) scrollJos()
  }, [chat, chatDeschis])

  const trimiteChat = async () => {
    if (!mesaj.trim()) return
    const mesajNou = mesaj
    setMesaj('')
    const timeNow = new Date().toLocaleString('ro-RO')
    setChat(prev => [...prev, { rol: 'user', mesaj: mesajNou, time: timeNow }])
    setLoading(true)
    try {
      const context = dateLive.map(d => `${d.nume}: ${d.valoare} ${d.unitate}`).join(', ')
      const res = await axios.post(`${API}/api/chat`, { mesaj: mesajNou, context })
      setChat(prev => [...prev, {
        rol: 'ai',
        mesaj: res.data.raspuns,
        time: new Date().toLocaleString('ro-RO'),
        id: Date.now()
      }])
    } catch {
      setChat(prev => [...prev, { rol: 'ai', mesaj: 'Eroare AI.', time: new Date().toLocaleString('ro-RO') }])
    }
    setLoading(false)
  }

  const salveazaInJurnal = async (mesajAI: string, index: number) => {
    // Gasim intrebarea userului inainte de acest raspuns AI
    const intrebare = chat[index - 1]?.mesaj || 'Conversatie AI'
    try {
      await axios.post(`${API}/api/jurnal/din-chat`, {
        titlu: intrebare.slice(0, 100),
        intrebare: intrebare,
        raspuns_ai: mesajAI,
        operator: 'operator'
      })
      setSavedToJurnal(prev => [...prev, index])
    } catch (e) { console.error(e) }
  }

  const ackAlerta = async (id: number) => {
    await axios.put(`${API}/api/alerte/${id}/rezolva`)
    fetchDate()
  }

  const getSenzor = (tip: string) => {
    const s = dateLive.find(d => d.tip === tip)
    return s?.valoare ?? '—'
  }

  const alerteActive = alerte.filter(a => !a.rezolvat)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-green-400">Dashboard</h1>
          <p className="text-gray-500 text-xs">Actualizat: {lastUpdate}</p>
        </div>
        <div className="flex gap-2 items-center">
          {alerteActive.length > 0 && (
            <div className="flex items-center gap-2 bg-red-900 px-3 py-1 rounded-full animate-pulse">
              <span className="text-red-400 text-sm">⚠️ {alerteActive.length} alerte active</span>
            </div>
          )}
          <button onClick={fetchDate} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* GAUGE-URI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {Object.entries(PRAGURI).map(([tip, p]: any) => (
          <Gauge key={tip} valoare={getSenzor(tip)} min={p.min} max={p.max}
            unitate={p.unitate} label={p.label}/>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* POMPE */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h2 className="text-green-400 font-semibold mb-3">Pompe</h2>
          <div className="grid grid-cols-2 gap-2">
            {pompe.map(p => (
              <div key={p.id} className={`flex justify-between items-center rounded-lg px-3 py-2 ${p.stare_curenta ? 'bg-green-900 border border-green-700' : 'bg-gray-700'}`}>
                <span className="text-gray-300 text-sm">{p.nume}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">{p.mod}</span>
                  <div className={`w-3 h-3 rounded-full ${p.stare_curenta ? 'bg-green-400' : 'bg-red-500'}`}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ALERTE */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-green-400 font-semibold">Alerte</h2>
            <Link href="/alerte" className="text-gray-500 hover:text-gray-300 text-xs">
              Vezi istoric →
            </Link>
          </div>
          {alerteActive.length === 0 ? (
            <div className="flex items-center gap-2 text-green-400 py-4 justify-center">
              <CheckCircle size={18}/>
              <span className="text-sm">Nicio alertă activă</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerteActive.map(a => (
                <div key={a.id} className={`flex justify-between items-start rounded-lg p-2 ${a.severitate === 'red' ? 'bg-red-950 border border-red-800' : 'bg-yellow-950 border border-yellow-800'}`}>
                  <div className="flex-1">
                    <div className={`text-xs font-medium ${a.severitate === 'red' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {a.severitate === 'red' ? '🔴' : '🟡'} {a.mesaj}
                    </div>
                    <div className="text-gray-600 text-xs mt-1">{new Date(a.time).toLocaleString('ro-RO')}</div>
                  </div>
                  <button onClick={() => ackAlerta(a.id)}
                    className="ml-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">
                    ACK
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* CHAT BUTTON */}
      <button onClick={deschideChat}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-500 rounded-full p-4 shadow-lg z-50">
        <MessageSquare size={24}/>
      </button>

      {/* CHAT PANEL */}
      {chatDeschis && (
        <div className="fixed bottom-20 right-6 w-96 bg-gray-800 rounded-xl border border-gray-600 shadow-xl z-50 flex flex-col" style={{ height: '520px' }}>
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="text-green-400 font-semibold">🤖 AI Headgrower</h3>
            <div className="flex items-center gap-2">
              <Link href="/jurnal" className="text-gray-400 hover:text-green-400" title="Vezi jurnal">
                <BookOpen size={16}/>
              </Link>
              <Link href="/istoric-chat" className="text-gray-400 hover:text-white">
                <History size={16}/>
              </Link>
              <button onClick={() => setChatDeschis(false)}>
                <X size={18} className="text-gray-400"/>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.length === 0 && (
              <p className="text-gray-500 text-sm text-center mt-8">
                Întreabă-mă orice despre fabrica ta.
              </p>
            )}
            {chat.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.rol === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${m.rol === 'user' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                  {m.mesaj}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {m.time && <span className="text-gray-600 text-xs">{m.time}</span>}
                  {m.rol === 'ai' && (
                    <button
                      onClick={() => salveazaInJurnal(m.mesaj, i)}
                      disabled={savedToJurnal.includes(i)}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        savedToJurnal.includes(i)
                          ? 'text-green-500 cursor-default'
                          : 'text-gray-500 hover:text-green-400'
                      }`}
                      title="Salvează în jurnal"
                    >
                      {savedToJurnal.includes(i) ? '✅ Salvat în jurnal' : '📋 Salvează în jurnal'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400">
                  Se gândește...
                </div>
              </div>
            )}
            <div ref={chatBottomRef}/>
          </div>

          <div className="p-4 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={mesaj}
              onChange={e => setMesaj(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && trimiteChat()}
              placeholder="Scrie o întrebare..."
              className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
            />
            <button onClick={trimiteChat}
              className="bg-green-600 hover:bg-green-500 rounded-lg px-3 py-2 text-sm">▶</button>
          </div>
        </div>
      )}

    </div>
  )
}