'use client'

import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Download, Plus, X } from 'lucide-react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const CULORI = ['#00d4aa', '#60a5fa', '#f97316', '#a78bfa', '#f43f5e', '#facc15', '#34d399', '#fb923c']

const GRAFICE_IMPLICITE = [
  { titlu: 'Temperatură', tip: 'temperatura', unitate: '°C', culoare: '#f97316', optim_min: 18, optim_max: 26 },
  { titlu: 'Umiditate', tip: 'umiditate', unitate: '%', culoare: '#60a5fa', optim_min: 60, optim_max: 80 },
  { titlu: 'EC', tip: 'ec', unitate: 'mS/cm', culoare: '#a78bfa', optim_min: 1.8, optim_max: 2.5 },
  { titlu: 'pH', tip: 'ph', unitate: '', culoare: '#00d4aa', optim_min: 5.8, optim_max: 6.5 },
  { titlu: 'CO2', tip: 'co2', unitate: 'ppm', culoare: '#34d399', optim_min: 400, optim_max: 1200 },
]

export default function Grafice() {
  const [senzori, setSenzori] = useState<any[]>([])
  const [intervalOre, setIntervalOre] = useState(24)
  const [dateGrafice, setDateGrafice] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')
  const [graficComparativ, setGraficComparativ] = useState<number[]>([])
  const [dateComparativ, setDateComparativ] = useState<any[]>([])
  const [loadingPDF, setLoadingPDF] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)

  const fetchSenzori = async () => {
    try {
      const res = await axios.get(`${API}/api/senzori`)
      setSenzori(res.data)
    } catch (e) {
      console.error('Eroare senzori:', e)
    }
  }

  const fetchDateGrafic = async (sensorId: number, ore: number) => {
    try {
      const res = await axios.get(`${API}/api/date/istoric/${sensorId}?ore=${ore}`)
      return res.data.map((d: any) => ({
        time: new Date(d.time).toLocaleString('ro-RO', {
          hour: '2-digit', minute: '2-digit',
          ...(ore > 24 ? { day: '2-digit', month: '2-digit' } : {})
        }),
        valoare: Math.round(d.valoare * 100) / 100
      }))
    } catch {
      return []
    }
  }

  const calcStats = (date: any[]) => {
    if (!date || date.length === 0) return { min: '—', max: '—', medie: '—' }
    const valori = date.map((d: any) => d.valoare)
    return {
      min: Math.min(...valori).toFixed(2),
      max: Math.max(...valori).toFixed(2),
      medie: (valori.reduce((a: number, b: number) => a + b, 0) / valori.length).toFixed(2)
    }
  }

  const incarcaToateGraficele = async () => {
    setLoading(true)
    const noi: any = {}
    for (const g of GRAFICE_IMPLICITE) {
      const senzoriDeTip = senzori.filter(s => s.tip === g.tip)
      noi[g.tip] = []
      for (const s of senzoriDeTip) {
        const date = await fetchDateGrafic(s.id, intervalOre)
        noi[g.tip].push({ sensor: s, date })
      }
    }
    setDateGrafice(noi)
    setLastUpdate(new Date().toLocaleTimeString('ro-RO'))
    setLoading(false)
  }

  const incarcaComparativ = async () => {
    if (graficComparativ.length === 0) return
    const rezultate: any[] = []
    for (const id of graficComparativ) {
      const s = senzori.find(s => s.id === id)
      if (!s) continue
      const date = await fetchDateGrafic(id, intervalOre)
      rezultate.push({ sensor: s, date })
    }
    // Combinam datele
    const maxLen = Math.max(...rezultate.map(r => r.date.length), 0)
    const combinat: any[] = []
    for (let i = 0; i < maxLen; i++) {
      const punct: any = { time: rezultate[0]?.date[i]?.time || '' }
      rezultate.forEach(({ sensor, date }) => {
        if (date[i]) punct[sensor.nume] = date[i].valoare
      })
      combinat.push(punct)
    }
    setDateComparativ(combinat)
  }

  useEffect(() => { fetchSenzori() }, [])
  useEffect(() => { if (senzori.length > 0) incarcaToateGraficele() }, [senzori, intervalOre])
  useEffect(() => { incarcaComparativ() }, [graficComparativ, intervalOre])

  const toggleSenzorComparativ = (id: number) => {
    setGraficComparativ(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const genereazaPDF = async () => {
    setLoadingPDF(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const intervalLabel = intervalOre === 24 ? '24 ore' : intervalOre === 168 ? '7 zile' : '30 zile'

      // Header
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(0, 212, 170)
      doc.setFontSize(20)
      doc.text('Raport Greenhub', 20, 18)
      doc.setFontSize(10)
      doc.setTextColor(156, 163, 175)
      doc.text(`Generat: ${new Date().toLocaleString('ro-RO')}`, 20, 27)
      doc.text(`Interval: ultimele ${intervalLabel}`, 20, 34)

      let y = 55

      // Per fiecare tip de grafic
      for (const g of GRAFICE_IMPLICITE) {
        const dateGrup = dateGrafice[g.tip] || []
        if (dateGrup.length === 0) continue

        doc.setTextColor(0, 212, 170)
        doc.setFontSize(13)
        doc.text(g.titlu, 20, y)
        y += 2
        doc.setDrawColor(0, 212, 170)
        doc.line(20, y, 190, y)
        y += 8

        for (const { sensor, date } of dateGrup) {
          const stats = calcStats(date)
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(10)
          doc.text(`Senzor: ${sensor.nume}`, 25, y)
          y += 6

          // Tabel stats
          doc.setFillColor(243, 244, 246)
          doc.rect(25, y - 4, 160, 16, 'F')
          doc.setTextColor(107, 114, 128)
          doc.setFontSize(9)
          doc.text('Minim', 35, y + 2)
          doc.text('Maxim', 85, y + 2)
          doc.text('Medie', 135, y + 2)
          y += 8
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(11)
          doc.text(`${stats.min} ${g.unitate}`, 35, y)
          doc.text(`${stats.max} ${g.unitate}`, 85, y)
          doc.text(`${stats.medie} ${g.unitate}`, 135, y)
          y += 8

          // Avertizari
          if (stats.max !== '—' && parseFloat(stats.max) > g.optim_max) {
            doc.setFillColor(254, 226, 226)
            doc.rect(25, y - 4, 160, 8, 'F')
            doc.setTextColor(220, 38, 38)
            doc.setFontSize(9)
            doc.text(`⚠ Max ${stats.max}${g.unitate} depaseste optimul (${g.optim_max}${g.unitate})`, 28, y)
            y += 10
          }
          if (stats.min !== '—' && parseFloat(stats.min) < g.optim_min) {
            doc.setFillColor(254, 226, 226)
            doc.rect(25, y - 4, 160, 8, 'F')
            doc.setTextColor(220, 38, 38)
            doc.setFontSize(9)
            doc.text(`⚠ Min ${stats.min}${g.unitate} sub optim (${g.optim_min}${g.unitate})`, 28, y)
            y += 10
          }

          doc.setTextColor(107, 114, 128)
          doc.setFontSize(8)
          doc.text(`Interval optim: ${g.optim_min} - ${g.optim_max} ${g.unitate}`, 25, y)
          y += 10

          if (y > 260) { doc.addPage(); y = 20 }
        }
        y += 5
      }

      // Corelatie EC/pH
      const ecDate = (dateGrafice['ec'] || []).flatMap((d: any) => d.date)
      const phDate = (dateGrafice['ph'] || []).flatMap((d: any) => d.date)
      if (ecDate.length > 0 && phDate.length > 0) {
        if (y > 220) { doc.addPage(); y = 20 }
        doc.setTextColor(0, 212, 170)
        doc.setFontSize(13)
        doc.text('Analiza Corelatie EC / pH', 20, y)
        y += 2
        doc.setDrawColor(0, 212, 170)
        doc.line(20, y, 190, y)
        y += 8

        const ecStats = calcStats(ecDate)
        const phStats = calcStats(phDate)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)

        const ecMed = parseFloat(ecStats.medie)
        const phMed = parseFloat(phStats.medie)

        let analiza = ''
        if (phMed > 6.5 && ecMed < 1.8) {
          analiza = 'pH ridicat si EC scazut — risc absorbtie redusa nutrienti. Verifica dozatorul.'
        } else if (phMed < 5.8) {
          analiza = 'pH prea scazut — risc toxicitate. Ajusteaza solutia nutritiva.'
        } else if (ecMed > 2.5) {
          analiza = 'EC ridicat — risc stres osmotic. Verifica concentratia solutiei.'
        } else if (phMed >= 5.8 && phMed <= 6.5 && ecMed >= 1.8 && ecMed <= 2.5) {
          analiza = 'EC si pH in parametri optimi. Sistem echilibrat.'
        } else {
          analiza = 'Parametri in limite acceptabile. Monitorizare continua recomandata.'
        }

        doc.setFillColor(243, 244, 246)
        doc.rect(20, y - 4, 170, 20, 'F')
        const lines = doc.splitTextToSize(analiza, 160)
        doc.text(lines, 25, y + 2)
        y += 25
      }

      // Footer
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(8)
      doc.text('Greenhub — Sistem de monitorizare vertical farming', 20, 285)
      doc.text(`Pagina 1`, 185, 285)

      doc.save(`raport-greenhub-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
      console.error('Eroare PDF:', e)
    }
    setLoadingPDF(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4" ref={pageRef}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white">
            <ArrowLeft size={20}/>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-green-400">📈 Grafice & Rapoarte</h1>
            <p className="text-gray-400 text-sm">Actualizat: {lastUpdate || '—'}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          {[{ label: '24h', val: 24 }, { label: '7 zile', val: 168 }, { label: '30 zile', val: 720 }].map(opt => (
            <button
              key={opt.val}
              onClick={() => setIntervalOre(opt.val)}
              className={`px-3 py-1 rounded text-sm font-medium ${intervalOre === opt.val ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={genereazaPDF}
            disabled={loadingPDF}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium"
          >
            <Download size={14}/>
            {loadingPDF ? 'Se generează...' : 'Raport PDF'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center text-gray-400 py-10">
          <div className="text-lg">Se încarcă graficele...</div>
        </div>
      )}

      {/* GRAFICE IMPLICITE */}
      {!loading && GRAFICE_IMPLICITE.map(g => {
        const dateGrup = dateGrafice[g.tip] || []
        const toateDatele: any[] = []

        if (dateGrup.length > 0) {
          const maxLen = Math.max(...dateGrup.map((d: any) => d.date.length))
          for (let i = 0; i < maxLen; i++) {
            const punct: any = { time: dateGrup[0]?.date[i]?.time || '' }
            dateGrup.forEach(({ sensor, date }: any) => {
              if (date[i]) punct[sensor.nume] = date[i].valoare
            })
            toateDatele.push(punct)
          }
        }

        const statsPerSenzor = dateGrup.map(({ sensor, date }: any) => ({
          sensor, stats: calcStats(date)
        }))

        const avertizari = statsPerSenzor.filter(({ stats }: any) =>
          (stats.max !== '—' && parseFloat(stats.max) > g.optim_max) ||
          (stats.min !== '—' && parseFloat(stats.min) < g.optim_min)
        )

        return (
          <div key={g.tip} className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">

            <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-green-400 font-semibold text-lg">{g.titlu}</h2>
                <p className="text-gray-500 text-xs">Optim: {g.optim_min} — {g.optim_max} {g.unitate}</p>
              </div>

              {/* Stats */}
              <div className="flex gap-3 flex-wrap">
                {statsPerSenzor.length > 0 ? statsPerSenzor.map(({ sensor, stats }: any) => (
                  <div key={sensor.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-2 text-center">{sensor.nume}</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingDown size={10} className="text-blue-400"/>
                          <span className="text-gray-500 text-xs">Min</span>
                        </div>
                        <div className="text-blue-400 font-bold">{stats.min} <span className="text-xs">{g.unitate}</span></div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Minus size={10} className="text-green-400"/>
                          <span className="text-gray-500 text-xs">Med</span>
                        </div>
                        <div className="text-green-400 font-bold">{stats.medie} <span className="text-xs">{g.unitate}</span></div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp size={10} className="text-orange-400"/>
                          <span className="text-gray-500 text-xs">Max</span>
                        </div>
                        <div className="text-orange-400 font-bold">{stats.max} <span className="text-xs">{g.unitate}</span></div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-500 text-xs text-center">Fără date pentru interval</div>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {['Min', 'Med', 'Max'].map(l => (
                        <div key={l} className="text-center">
                          <div className="text-gray-500 text-xs">{l}</div>
                          <div className="text-gray-600 font-bold">—</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Avertizari */}
            {avertizari.length > 0 && (
              <div className="bg-red-950 border border-red-800 rounded-lg p-2 mb-3">
                {avertizari.map(({ sensor, stats }: any) => (
                  <div key={sensor.id} className="text-red-400 text-xs">
                    ⚠️ {sensor.nume}:
                    {parseFloat(stats.max) > g.optim_max && ` Max ${stats.max}${g.unitate} depășește optimul (${g.optim_max}${g.unitate})`}
                    {parseFloat(stats.min) < g.optim_min && ` Min ${stats.min}${g.unitate} sub optim (${g.optim_min}${g.unitate})`}
                  </div>
                ))}
              </div>
            )}

            {/* Grafic */}
            {toateDatele.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={toateDatele} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                  <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd"/>
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} domain={['auto', 'auto']}/>
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}/>
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}/>
                  <ReferenceLine y={g.optim_max} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Max optim', fill: '#ef4444', fontSize: 9 }}/>
                  <ReferenceLine y={g.optim_min} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'Min optim', fill: '#3b82f6', fontSize: 9 }}/>
                  {dateGrup.map(({ sensor }: any, idx: number) => (
                    <Line key={sensor.id} type="monotone" dataKey={sensor.nume} stroke={CULORI[idx % CULORI.length]} dot={false} strokeWidth={2}/>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
                <div className="text-center">
                  <div className="text-gray-600 text-sm">Nu există date pentru interval</div>
                  <div className="text-gray-700 text-xs mt-1">Datele vor apărea automat când senzorii sunt conectați</div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* GRAFIC COMPARATIV */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
        <h2 className="text-green-400 font-semibold text-lg mb-1">Grafic Comparativ</h2>
        <p className="text-gray-500 text-xs mb-4">Selectează senzori din liste pentru a-i compara pe același grafic</p>

        {/* Selector senzori */}
        <div className="flex flex-wrap gap-2 mb-4">
          {senzori.length > 0 ? senzori.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => toggleSenzorComparativ(s.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                graficComparativ.includes(s.id)
                  ? 'border-transparent text-white'
                  : 'border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
              style={graficComparativ.includes(s.id) ? { background: CULORI[idx % CULORI.length] } : {}}
            >
              {graficComparativ.includes(s.id) ? <X size={10}/> : <Plus size={10}/>}
              {s.nume} ({s.tip})
            </button>
          )) : (
            <p className="text-gray-600 text-sm">Niciun senzor disponibil momentan. Vor apărea după conectarea hardware.</p>
          )}
        </div>

        {/* Grafic comparativ */}
        {graficComparativ.length > 0 && dateComparativ.length > 0 ? (
          <>
            {/* Stats comparative */}
            <div className="flex flex-wrap gap-3 mb-4">
              {graficComparativ.map((id, idx) => {
                const s = senzori.find(s => s.id === id)
                if (!s) return null
                const date = dateComparativ.map(d => ({ valoare: d[s.nume] })).filter(d => d.valoare !== undefined)
                const stats = calcStats(date)
                return (
                  <div key={id} className="bg-gray-700 rounded-lg p-3">
                    <div className="text-xs mb-2 font-medium" style={{ color: CULORI[idx % CULORI.length] }}>{s.nume}</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><div className="text-gray-500 text-xs">Min</div><div className="text-blue-400 font-bold text-sm">{stats.min}</div></div>
                      <div><div className="text-gray-500 text-xs">Med</div><div className="text-green-400 font-bold text-sm">{stats.medie}</div></div>
                      <div><div className="text-gray-500 text-xs">Max</div><div className="text-orange-400 font-bold text-sm">{stats.max}</div></div>
                    </div>
                  </div>
                )
              })}
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dateComparativ} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd"/>
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }}/>
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}/>
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}/>
                {graficComparativ.map((id, idx) => {
                  const s = senzori.find(s => s.id === id)
                  if (!s) return null
                  return <Line key={id} type="monotone" dataKey={s.nume} stroke={CULORI[idx % CULORI.length]} dot={false} strokeWidth={2}/>
                })}
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="h-40 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-gray-600 text-sm">
                {graficComparativ.length === 0
                  ? 'Selectează senzori de mai sus pentru a genera graficul comparativ'
                  : 'Se încarcă datele...'
                }
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}