'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

type TipRaport = 'sumar' | 'saptamana' | 'luna' | 'loturi_active'

const LUNI = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
]

export default function Rapoarte() {
  const [tipRaport, setTipRaport] = useState<TipRaport>('sumar')
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<any>(null)

  // Filtre
  const [saptamanaStart, setSaptamanaStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [saptamanaEnd, setSaptamanaEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [lunaSelectata, setLunaSelectata] = useState(new Date().getMonth())
  const [anSelectat, setAnSelectat] = useState(new Date().getFullYear())

  const genereaza = async () => {
    setLoading(true)
    setDate(null)
    try {
      let res
      switch (tipRaport) {
        case 'sumar':
          res = await axios.get(`${API}/api/rapoarte/sumar`)
          break
        case 'saptamana':
          res = await axios.get(`${API}/api/rapoarte/saptamana?start=${saptamanaStart}&end=${saptamanaEnd}`)
          break
        case 'luna':
          res = await axios.get(`${API}/api/rapoarte/luna?luna=${lunaSelectata + 1}&an=${anSelectat}`)
          break
        case 'loturi_active':
          res = await axios.get(`${API}/api/rapoarte/loturi-active`)
          break
      }
      setDate(res?.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const exportPDF = () => {
    if (!date) return
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => {
      const { jsPDF } = (window as any).jspdf
      const doc = new jsPDF()
      let y = 20

      const addTitle = (text: string) => {
        doc.setFontSize(16)
        doc.setTextColor(34, 197, 94)
        doc.text(text, 14, y)
        y += 10
        doc.setDrawColor(34, 197, 94)
        doc.line(14, y, 196, y)
        y += 8
      }

      const addSubtitle = (text: string) => {
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(text, 14, y)
        y += 8
      }

      const addRow = (label: string, value: string) => {
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.text(label + ':', 14, y)
        doc.text(value, 100, y)
        y += 6
        if (y > 270) { doc.addPage(); y = 20 }
      }

      const addSeparator = () => { y += 4 }

      // Header
      doc.setFontSize(20)
      doc.setTextColor(34, 197, 94)
      doc.text('Greenhub — Raport Productie', 14, y)
      y += 8
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generat: ${new Date().toLocaleString('ro-RO')}`, 14, y)
      y += 12

      if (tipRaport === 'sumar' && date) {
        addTitle('Sumar General Ferma')
        addRow('Total pozitii', `${date.hala?.total_pozitii}`)
        addRow('Pozitii ocupate', `${date.hala?.pozitii_ocupate}`)
        addRow('Pozitii libere', `${date.hala?.pozitii_libere}`)
        addRow('Loturi active', `${date.loturi_active?.length}`)
        addSeparator()

        if (date.loturi_active?.length > 0) {
          addSubtitle('Loturi in productie:')
          date.loturi_active.forEach((l: any) => {
            addRow(l.lot_code, `${l.specie} | ${l.faza} | Zi ${l.zile_in_faza}/${l.durata_zile}`)
          })
        }
      }

      if (tipRaport === 'saptamana' && date) {
        addTitle(`Raport Saptamanal: ${saptamanaStart} - ${saptamanaEnd}`)
        addRow('Total recolte', `${date.recolte?.length}`)
        addRow('Total plante bune', `${date.totale?.plante_bune}`)
        addRow('Total pierderi', `${date.totale?.plante_pierderi}`)
        addRow('Greutate totala', `${date.totale?.greutate_kg || '—'} kg`)
        addRow('Loturi introduse', `${date.loturi_introduse?.length}`)
        addSeparator()

        if (date.recolte?.length > 0) {
          addSubtitle('Recolte:')
          date.recolte.forEach((r: any) => {
            addRow(r.lot_code, `${r.specie} | Bune: ${r.plante_bune} | Pierderi: ${r.plante_pierderi} | ${new Date(r.data_recoltare).toLocaleDateString('ro-RO')}`)
          })
        }

        if (date.loturi_introduse?.length > 0) {
          addSeparator()
          addSubtitle('Loturi introduse in productie:')
          date.loturi_introduse.forEach((l: any) => {
            addRow(l.lot_code, `${l.specie} | ${l.total_tavi} tavi | ${new Date(l.data_creare).toLocaleDateString('ro-RO')}`)
          })
        }
      }

      if (tipRaport === 'luna' && date) {
        addTitle(`Raport Luna: ${LUNI[lunaSelectata]} ${anSelectat}`)
        addRow('Total recolte', `${date.recolte?.length}`)
        addRow('Total plante bune', `${date.totale?.plante_bune}`)
        addRow('Total pierderi', `${date.totale?.plante_pierderi}`)
        addRow('Greutate totala', `${date.totale?.greutate_kg || '—'} kg`)
        addRow('Rata pierderi', `${date.totale?.rata_pierderi || 0}%`)
        addRow('Loturi introduse', `${date.loturi_introduse?.length}`)
        addRow('Loturi finalizate', `${date.loturi_finalizate?.length}`)
        addSeparator()

        if (date.recolte?.length > 0) {
          addSubtitle('Toate recoltele lunii:')
          date.recolte.forEach((r: any) => {
            addRow(r.lot_code, `${r.specie} | Bune: ${r.plante_bune} | Pierderi: ${r.plante_pierderi} | ${r.calitate}`)
          })
        }
      }

      if (tipRaport === 'loturi_active' && date) {
        addTitle('Loturi Active in Productie')
        addRow('Total loturi', `${date.loturi?.length}`)
        addSeparator()

        date.loturi?.forEach((l: any) => {
          addSubtitle(`${l.lot_code} — ${l.specie}`)
          addRow('Faza curenta', `${l.faza}`)
          addRow('Zile in faza', `${l.zile_in_faza} din ${l.durata_zile}`)
          addRow('Data estimata schimbare', l.data_end_estimat ? new Date(l.data_end_estimat).toLocaleDateString('ro-RO') : '—')
          addRow('Total tavi', `${l.total_tavi}`)
          addRow('Pozitii mapate', `${l.pozitii_mapate}`)
          addSeparator()
        })
      }

      const numeFisier = `greenhub_raport_${tipRaport}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(numeFisier)
    }
    document.head.appendChild(script)
  }

  const renderDate = () => {
    if (!date) return null

    if (tipRaport === 'sumar') return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total poziții', val: date.hala?.total_pozitii, color: 'text-white' },
            { label: 'Pozitii ocupate', val: date.hala?.pozitii_ocupate, color: 'text-blue-400' },
            { label: 'Pozitii libere', val: date.hala?.pozitii_libere, color: 'text-green-400' },
            { label: 'Loturi active', val: date.loturi_active?.length, color: 'text-yellow-400' },
          ].map(item => (
            <div key={item.label} className="bg-gray-700 rounded-xl p-4 text-center">
              <div className="text-gray-400 text-xs mb-1">{item.label}</div>
              <div className={`text-3xl font-bold ${item.color}`}>{item.val ?? '—'}</div>
            </div>
          ))}
        </div>

        {date.loturi_active?.length > 0 && (
          <div>
            <h3 className="text-green-400 font-semibold mb-2">Loturi în producție</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Lot</th>
                    <th className="text-left py-2 px-3">Specie</th>
                    <th className="text-left py-2 px-3">Faza</th>
                    <th className="text-left py-2 px-3">Progres</th>
                    <th className="text-left py-2 px-3">Tăvi</th>
                    <th className="text-left py-2 px-3">Data estimată</th>
                  </tr>
                </thead>
                <tbody>
                  {date.loturi_active.map((l: any) => {
                    const pct = l.durata_zile > 0 ? Math.min(Math.round(l.zile_in_faza / l.durata_zile * 100), 100) : 0
                    const expirat = l.zile_in_faza > l.durata_zile
                    return (
                      <tr key={l.id} className={`border-b border-gray-800 ${expirat ? 'bg-red-950' : ''}`}>
                        <td className="py-2 px-3 font-mono text-green-400">{l.lot_code}</td>
                        <td className="py-2 px-3">{l.specie}</td>
                        <td className="py-2 px-3">{l.faza}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-700 rounded-full h-2">
                              <div className={`h-2 rounded-full ${expirat ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${pct}%` }}/>
                            </div>
                            <span className={`text-xs ${expirat ? 'text-red-400' : 'text-gray-400'}`}>
                              Zi {l.zile_in_faza}/{l.durata_zile}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3">{l.total_tavi}</td>
                        <td className="py-2 px-3 text-gray-400 text-xs">
                          {l.data_end_estimat ? new Date(l.data_end_estimat).toLocaleDateString('ro-RO') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )

    if (tipRaport === 'saptamana' || tipRaport === 'luna') return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total recolte', val: date.recolte?.length, color: 'text-green-400' },
            { label: 'Plante bune', val: date.totale?.plante_bune, color: 'text-green-400' },
            { label: 'Pierderi', val: date.totale?.plante_pierderi, color: 'text-red-400' },
            { label: 'Greutate', val: date.totale?.greutate_kg ? `${date.totale.greutate_kg} kg` : '—', color: 'text-blue-400' },
          ].map(item => (
            <div key={item.label} className="bg-gray-700 rounded-xl p-4 text-center">
              <div className="text-gray-400 text-xs mb-1">{item.label}</div>
              <div className={`text-2xl font-bold ${item.color}`}>{item.val ?? '—'}</div>
            </div>
          ))}
        </div>

        {date.recolte?.length > 0 && (
          <div>
            <h3 className="text-green-400 font-semibold mb-2">Recolte</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Lot</th>
                    <th className="text-left py-2 px-3">Specie</th>
                    <th className="text-left py-2 px-3">Plante bune</th>
                    <th className="text-left py-2 px-3">Pierderi</th>
                    <th className="text-left py-2 px-3">Greutate</th>
                    <th className="text-left py-2 px-3">Calitate</th>
                    <th className="text-left py-2 px-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {date.recolte.map((r: any) => (
                    <tr key={r.id} className="border-b border-gray-800">
                      <td className="py-2 px-3 font-mono text-green-400">{r.lot_code}</td>
                      <td className="py-2 px-3">{r.specie}</td>
                      <td className="py-2 px-3 text-green-400">{r.plante_bune}</td>
                      <td className="py-2 px-3 text-red-400">{r.plante_pierderi}</td>
                      <td className="py-2 px-3">{r.greutate_kg ? `${r.greutate_kg} kg` : '—'}</td>
                      <td className="py-2 px-3 capitalize">{r.calitate}</td>
                      <td className="py-2 px-3 text-gray-400 text-xs">
                        {new Date(r.data_recoltare).toLocaleDateString('ro-RO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {date.loturi_introduse?.length > 0 && (
          <div>
            <h3 className="text-green-400 font-semibold mb-2">Loturi introduse în producție</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Lot</th>
                    <th className="text-left py-2 px-3">Specie</th>
                    <th className="text-left py-2 px-3">Tăvi</th>
                    <th className="text-left py-2 px-3">Data creare</th>
                  </tr>
                </thead>
                <tbody>
                  {date.loturi_introduse.map((l: any) => (
                    <tr key={l.id} className="border-b border-gray-800">
                      <td className="py-2 px-3 font-mono text-green-400">{l.lot_code}</td>
                      <td className="py-2 px-3">{l.specie}</td>
                      <td className="py-2 px-3">{l.total_tavi}</td>
                      <td className="py-2 px-3 text-gray-400 text-xs">
                        {new Date(l.data_creare).toLocaleDateString('ro-RO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tipRaport === 'luna' && date.loturi_finalizate?.length > 0 && (
          <div>
            <h3 className="text-green-400 font-semibold mb-2">Loturi finalizate</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Lot</th>
                    <th className="text-left py-2 px-3">Specie</th>
                    <th className="text-left py-2 px-3">Data recoltare</th>
                  </tr>
                </thead>
                <tbody>
                  {date.loturi_finalizate.map((l: any) => (
                    <tr key={l.id} className="border-b border-gray-800">
                      <td className="py-2 px-3 font-mono text-green-400">{l.lot_code}</td>
                      <td className="py-2 px-3">{l.specie}</td>
                      <td className="py-2 px-3 text-gray-400 text-xs">
                        {new Date(l.data_recoltare).toLocaleDateString('ro-RO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )

    if (tipRaport === 'loturi_active') return (
      <div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">Lot</th>
                <th className="text-left py-2 px-3">Specie</th>
                <th className="text-left py-2 px-3">Faza</th>
                <th className="text-left py-2 px-3">Progres</th>
                <th className="text-left py-2 px-3">Tăvi</th>
                <th className="text-left py-2 px-3">Pozitii</th>
                <th className="text-left py-2 px-3">Estimat schimbare</th>
                <th className="text-left py-2 px-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {date.loturi?.map((l: any) => {
                const pct = l.durata_zile > 0 ? Math.min(Math.round(l.zile_in_faza / l.durata_zile * 100), 100) : 0
                const expirat = l.durata_zile > 0 && l.zile_in_faza > l.durata_zile
                const aproape = !expirat && l.durata_zile > 0 && l.zile_in_faza >= l.durata_zile - 2
                return (
                  <tr key={l.id} className={`border-b border-gray-800 ${expirat ? 'bg-red-950' : aproape ? 'bg-yellow-950' : ''}`}>
                    <td className="py-2 px-3 font-mono text-green-400">{l.lot_code}</td>
                    <td className="py-2 px-3">{l.specie}</td>
                    <td className="py-2 px-3">{l.faza}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div className={`h-2 rounded-full ${expirat ? 'bg-red-500' : aproape ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${pct}%` }}/>
                        </div>
                        <span className={`text-xs ${expirat ? 'text-red-400' : aproape ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {l.zile_in_faza}/{l.durata_zile} zile
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">{l.total_tavi}</td>
                    <td className="py-2 px-3">{l.pozitii_mapate || '—'}</td>
                    <td className="py-2 px-3 text-xs text-gray-400">
                      {l.data_end_estimat ? new Date(l.data_end_estimat).toLocaleDateString('ro-RO') : '—'}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500">{l.note || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const aniDisponibili = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-400">📊 Rapoarte Producție</h1>
          <p className="text-gray-500 text-sm">Generează și exportă rapoarte</p>
        </div>
        {date && (
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium"
          >
            📄 Export PDF
          </button>
        )}
      </div>

      {/* Selector tip raport */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {([
          { id: 'sumar', label: '📋 Sumar General', desc: 'Status curent fermă' },
          { id: 'saptamana', label: '📅 Raport Săptămânal', desc: 'Interval selectabil' },
          { id: 'luna', label: '📆 Raport Lunar', desc: 'Luni complete' },
          { id: 'loturi_active', label: '🌿 Loturi Active', desc: 'Ce este în producție' },
        ] as const).map(tip => (
          <button
            key={tip.id}
            onClick={() => { setTipRaport(tip.id); setDate(null) }}
            className={`p-4 rounded-xl border text-left transition-colors ${
              tipRaport === tip.id
                ? 'bg-green-900 border-green-600'
                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="font-medium text-sm">{tip.label}</div>
            <div className="text-gray-500 text-xs mt-1">{tip.desc}</div>
          </button>
        ))}
      </div>

      {/* Filtre */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
        <h3 className="text-gray-300 font-medium mb-3">Parametri raport</h3>

        {tipRaport === 'sumar' && (
          <p className="text-gray-500 text-sm">Raportul va afișa situația curentă din fermă — nu necesită filtre.</p>
        )}

        {tipRaport === 'loturi_active' && (
          <p className="text-gray-500 text-sm">Afișează toate loturile active cu progresul lor — nu necesită filtre.</p>
        )}

        {tipRaport === 'saptamana' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Data început</label>
              <input
                type="date"
                value={saptamanaStart}
                onChange={e => setSaptamanaStart(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Data sfârșit</label>
              <input
                type="date"
                value={saptamanaEnd}
                onChange={e => setSaptamanaEnd(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
              />
            </div>
          </div>
        )}

        {tipRaport === 'luna' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Luna</label>
              <select
                value={lunaSelectata}
                onChange={e => setLunaSelectata(parseInt(e.target.value))}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
              >
                {LUNI.map((l, i) => <option key={i} value={i}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Anul</label>
              <select
                value={anSelectat}
                onChange={e => setAnSelectat(parseInt(e.target.value))}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
              >
                {aniDisponibili.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        )}

        <button
          onClick={genereaza}
          disabled={loading}
          className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-sm font-bold"
        >
          {loading ? '⏳ Se generează...' : '▶ Generează raport'}
        </button>
      </div>

      {/* Rezultate */}
      {date && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-green-400 font-semibold">
              {tipRaport === 'sumar' && '📋 Sumar General'}
              {tipRaport === 'saptamana' && `📅 Raport ${saptamanaStart} — ${saptamanaEnd}`}
              {tipRaport === 'luna' && `📆 ${LUNI[lunaSelectata]} ${anSelectat}`}
              {tipRaport === 'loturi_active' && '🌿 Loturi Active'}
            </h3>
            <button
              onClick={exportPDF}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs font-medium"
            >
              📄 Export PDF
            </button>
          </div>
          {renderDate()}
        </div>
      )}

    </div>
  )
}