'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { X, Plus, ArrowRight, Leaf, Package } from 'lucide-react'

const API = 'http://localhost:8000'

function ModalPozitie({ shelf, onClose, onRefresh }: any) {
  const [detalii, setDetalii] = useState<any>(null)
  const [loturi, setLoturi] = useState<any[]>([])
  const [showAdauga, setShowAdauga] = useState(false)
  const [showTransfer, setShowTransfer] = useState<number | null>(null)
  const [showRecoltare, setShowRecoltare] = useState<number | null>(null)
  const [pozitiiLibere, setPozitiiLibere] = useState<any[]>([])
  const [formAdauga, setFormAdauga] = useState({ lot_id: '', tavi_count: 1, plante_per_tava: 10 })
  const [formTransfer, setFormTransfer] = useState({ shelf_id_dest: '', tavi_count: 1 })
  const [formRecoltare, setFormRecoltare] = useState({
    tavi_recoltate: 0, plante_bune: 0, plante_degradate: 0,
    plante_pierderi: 0, greutate_totala_kg: '', calitate_generala: 'buna', note: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDetalii()
    fetchLoturiDisponibile()
  }, [])

  const fetchDetalii = async () => {
    const res = await axios.get(`${API}/api/hala/pozitie/${shelf.shelf_id}`)
    setDetalii(res.data)
  }

  const fetchLoturiDisponibile = async () => {
    const res = await axios.get(`${API}/api/loturi`)
    setLoturi(res.data)
  }

  const fetchPozitiiLibere = async (tavi: number) => {
    const res = await axios.get(`${API}/api/hala/pozitii-libere?tavi_necesare=${tavi}`)
    setPozitiiLibere(res.data.filter((p: any) => p.shelf_id !== shelf.shelf_id))
  }

  const adaugaLot = async () => {
    if (!formAdauga.lot_id) return
    setLoading(true)
    try {
      await axios.post(`${API}/api/hala/adauga-lot`, {
        lot_id: parseInt(formAdauga.lot_id),
        shelf_id: shelf.shelf_id,
        tavi_count: formAdauga.tavi_count,
        plante_per_tava: formAdauga.plante_per_tava,
      })
      setShowAdauga(false)
      fetchDetalii()
      onRefresh()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const transfer = async (position_id: number) => {
    if (!formTransfer.shelf_id_dest) return
    setLoading(true)
    try {
      await axios.post(`${API}/api/hala/transfer`, {
        position_id,
        shelf_id_dest: parseInt(formTransfer.shelf_id_dest),
        tavi_count: formTransfer.tavi_count,
      })
      setShowTransfer(null)
      fetchDetalii()
      onRefresh()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const schimbaFaza = async (lot_id: number) => {
    await axios.put(`${API}/api/loturi/${lot_id}/schimba-faza`, { operator: 'operator' })
    fetchDetalii()
    onRefresh()
  }

  const recoltare = async (lot_id: number) => {
    setLoading(true)
    try {
      await axios.post(`${API}/api/loturi/${lot_id}/recoltare`, {
        ...formRecoltare,
        greutate_totala_kg: parseFloat(formRecoltare.greutate_totala_kg) || null,
        operator: 'operator'
      })
      setShowRecoltare(null)
      fetchDetalii()
      onRefresh()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const getStatusLot = (lot: any) => {
    if (!lot.durata_zile || lot.durata_zile === 0) return 'ok'
    const pct = (lot.zile_in_faza || 0) / lot.durata_zile
    if (pct >= 1) return 'expirat'
    if (pct >= 0.8) return 'aproape'
    return 'ok'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        <div className="flex justify-between items-center p-5 border-b border-gray-700 sticky top-0 bg-gray-800 rounded-t-2xl">
          <div>
            <h2 className="text-green-400 font-bold text-xl">{shelf.pozitie_cod}</h2>
            <p className="text-gray-400 text-sm mt-1">
              <span className="text-white font-medium">{shelf.tavi_ocupate}</span> tavi ocupate din{' '}
              <span className="text-white font-medium">{shelf.capacitate_tavi}</span> —{' '}
              <span className="text-green-400 font-medium">{shelf.tavi_libere} libere</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X size={20} className="text-gray-400"/>
          </button>
        </div>

        <div className="p-5">

          {/* Bara capacitate */}
          <div className="mb-5">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${shelf.capacitate_tavi > 0 ? (shelf.tavi_ocupate / shelf.capacitate_tavi * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Loturi active */}
          {detalii?.loturi.map((lot: any) => {
            const status = getStatusLot(lot)
            const progres = lot.durata_zile > 0 ? Math.min((lot.zile_in_faza || 0) / lot.durata_zile * 100, 100) : 0

            return (
              <div key={lot.position_id} className={`rounded-xl p-4 mb-4 border ${
                status === 'expirat' ? 'bg-red-950 border-red-700' :
                status === 'aproape' ? 'bg-yellow-950 border-yellow-700' :
                'bg-gray-700 border-gray-600'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-white font-bold">{lot.lot_code}</div>
                    <div className="text-gray-400 text-sm">{lot.specie}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    status === 'expirat' ? 'bg-red-700 text-red-100' :
                    status === 'aproape' ? 'bg-yellow-700 text-yellow-100' :
                    'bg-green-800 text-green-100'
                  }`}>
                    {lot.faza}
                  </span>
                </div>

                {/* Progres faza */}
                {lot.durata_zile > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progres fază</span>
                      <span className={status === 'expirat' ? 'text-red-400 font-bold' : ''}>
                        Zi {lot.zile_in_faza || 0} din {lot.durata_zile}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          status === 'expirat' ? 'bg-red-500' :
                          status === 'aproape' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${progres}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-gray-500 text-xs">Tavi</div>
                    <div className="text-white font-bold text-lg">{lot.tavi_count}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-gray-500 text-xs">Plante/tavă</div>
                    <div className="text-white font-bold text-lg">{lot.plante_per_tava}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-gray-500 text-xs">Total plante</div>
                    <div className="text-white font-bold text-lg">{lot.tavi_count * lot.plante_per_tava}</div>
                  </div>
                </div>

                {status === 'expirat' && (
                  <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-3 text-red-200 text-sm">
                    ⚠️ Faza a expirat! Schimbă faza sau recoltează imediat.
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => schimbaFaza(lot.lot_id)}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs font-medium">
                    <ArrowRight size={14}/> Schimbă faza
                  </button>
                  <button onClick={() => { setShowTransfer(lot.position_id); fetchPozitiiLibere(1) }}
                    className="flex items-center gap-1 px-3 py-2 bg-yellow-700 hover:bg-yellow-600 rounded-lg text-xs font-medium">
                    <ArrowRight size={14}/> Transfer
                  </button>
                  <button onClick={() => setShowRecoltare(lot.lot_id)}
                    className="flex items-center gap-1 px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-medium">
                    <Leaf size={14}/> Recoltare
                  </button>
                </div>

                {showTransfer === lot.position_id && (
                  <div className="mt-3 bg-gray-800 rounded-xl p-4 border border-yellow-700">
                    <div className="text-yellow-400 font-medium text-sm mb-3">Transfer tavi</div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-gray-500 text-xs block mb-1">Nr tavi (max {lot.tavi_count})</label>
                        <input type="number" min={1} max={lot.tavi_count}
                          value={formTransfer.tavi_count}
                          onChange={e => setFormTransfer(p => ({ ...p, tavi_count: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs block mb-1">Destinație</label>
                        <select value={formTransfer.shelf_id_dest}
                          onChange={e => setFormTransfer(p => ({ ...p, shelf_id_dest: e.target.value }))}
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                          <option value="">Selectează...</option>
                          {pozitiiLibere.map(p => (
                            <option key={p.shelf_id} value={p.shelf_id}>
                              {p.pozitie_cod} — {p.tavi_libere} tavi libere
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => transfer(lot.position_id)}
                        disabled={loading || !formTransfer.shelf_id_dest}
                        className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 rounded-lg text-sm font-medium disabled:opacity-50">
                        ✅ Confirmă transfer
                      </button>
                      <button onClick={() => setShowTransfer(null)}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-sm">
                        Anulează
                      </button>
                    </div>
                  </div>
                )}

                {showRecoltare === lot.lot_id && (
                  <div className="mt-3 bg-gray-800 rounded-xl p-4 border border-green-700">
                    <div className="text-green-400 font-medium text-sm mb-3">Înregistrare recoltare</div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[
                        { key: 'tavi_recoltate', label: 'Tavi recoltate' },
                        { key: 'plante_bune', label: '✅ Plante bune' },
                        { key: 'plante_degradate', label: '⚠️ Degradate' },
                        { key: 'plante_pierderi', label: '❌ Pierderi' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="text-gray-500 text-xs block mb-1">{f.label}</label>
                          <input type="number" min={0}
                            value={(formRecoltare as any)[f.key]}
                            onChange={e => setFormRecoltare(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="text-gray-500 text-xs block mb-1">Greutate totală (kg)</label>
                        <input type="number" step="0.1"
                          value={formRecoltare.greutate_totala_kg}
                          onChange={e => setFormRecoltare(p => ({ ...p, greutate_totala_kg: e.target.value }))}
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs block mb-1">Calitate generală</label>
                        <select value={formRecoltare.calitate_generala}
                          onChange={e => setFormRecoltare(p => ({ ...p, calitate_generala: e.target.value }))}
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                          <option value="excelenta">⭐ Excelentă</option>
                          <option value="buna">👍 Bună</option>
                          <option value="medie">👌 Medie</option>
                          <option value="slaba">👎 Slabă</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-gray-500 text-xs block mb-1">Note / Motiv pierderi</label>
                      <textarea value={formRecoltare.note}
                        onChange={e => setFormRecoltare(p => ({ ...p, note: e.target.value }))}
                        rows={2}
                        className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => recoltare(lot.lot_id)} disabled={loading}
                        className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium disabled:opacity-50">
                        ✅ Confirmă recoltarea
                      </button>
                      <button onClick={() => setShowRecoltare(null)}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-sm">
                        Anulează
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {detalii?.loturi.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-xl mb-4">
              <Package size={40} className="mx-auto mb-3 text-gray-600"/>
              <p className="text-gray-500">Poziție goală</p>
              <p className="text-gray-600 text-sm mt-1">Adaugă un lot pentru a începe</p>
            </div>
          )}

          {shelf.tavi_libere > 0 && (
            <button onClick={() => setShowAdauga(!showAdauga)}
              className="w-full py-3 border-2 border-dashed border-green-700 text-green-400 hover:bg-green-950 rounded-xl text-sm flex items-center justify-center gap-2 font-medium">
              <Plus size={16}/> Adaugă lot pe această poziție
            </button>
          )}

          {showAdauga && (
            <div className="mt-3 bg-gray-700 rounded-xl p-4">
              <div className="text-green-400 font-medium mb-3">Selectează lot</div>
              <select value={formAdauga.lot_id}
                onChange={e => setFormAdauga(p => ({ ...p, lot_id: e.target.value }))}
                className="w-full bg-gray-600 rounded-lg px-3 py-2 text-sm text-white mb-3">
                <option value="">Selectează lot...</option>
                {loturi.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.lot_code} — {l.specie} — {l.faza_curenta} — {l.tavi_nemapate} tavi nemapate
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Nr tavi (max {shelf.tavi_libere})</label>
                  <input type="number" min={1} max={shelf.tavi_libere}
                    value={formAdauga.tavi_count}
                    onChange={e => setFormAdauga(p => ({ ...p, tavi_count: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Plante/tavă</label>
                  <input type="number" min={1}
                    value={formAdauga.plante_per_tava}
                    onChange={e => setFormAdauga(p => ({ ...p, plante_per_tava: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={adaugaLot} disabled={loading || !formAdauga.lot_id}
                  className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium disabled:opacity-50">
                  ✅ Adaugă
                </button>
                <button onClick={() => setShowAdauga(false)}
                  className="px-4 py-2 bg-gray-600 rounded-lg text-sm">
                  Anulează
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Productie() {
  const [hala, setHala] = useState<any[]>([])
  const [loturi, setLoturi] = useState<any[]>([])
  const [selectedShelf, setSelectedShelf] = useState<any>(null)
  const [showStartProductie, setShowStartProductie] = useState(false)
  const [specii, setSpecii] = useState<any[]>([])
  const [formLot, setFormLot] = useState({
    species_id: '', total_tavi: 10, plante_per_tava: 20, note: ''
  })
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchAll = async () => {
    const [halaRes, loturiRes, speciiRes] = await Promise.all([
      axios.get(`${API}/api/hala/status`),
      axios.get(`${API}/api/loturi`),
      axios.get(`${API}/api/specii`),
    ])
    setHala(halaRes.data)
    setLoturi(loturiRes.data)
    setSpecii(speciiRes.data)
    setLastUpdate(new Date().toLocaleTimeString('ro-RO'))
  }

  useEffect(() => { fetchAll() }, [])

  const createLot = async () => {
    if (!formLot.species_id) return
    setLoading(true)
    try {
      await axios.post(`${API}/api/loturi`, {
        ...formLot,
        species_id: parseInt(formLot.species_id),
        operator: 'operator'
      })
      setShowStartProductie(false)
      setFormLot({ species_id: '', total_tavi: 10, plante_per_tava: 20, note: '' })
      fetchAll()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // Grupeaza pe module
  const module: any = {}
  hala.forEach(p => {
    if (!module[p.modul]) module[p.modul] = []
    module[p.modul].push(p)
  })

  const getCardStyle = (p: any) => {
    if (p.tavi_ocupate === 0) return {
      border: 'border-gray-700',
      bg: 'bg-gray-900',
      text: 'text-gray-600',
      indicator: ''
    }
    const pctOcupat = p.tavi_ocupate / p.capacitate_tavi
    if (pctOcupat >= 1) return {
      border: 'border-blue-600',
      bg: 'bg-blue-950',
      text: 'text-blue-300',
      indicator: 'bg-blue-500'
    }
    return {
      border: 'border-green-700',
      bg: 'bg-green-950',
      text: 'text-green-300',
      indicator: 'bg-green-500'
    }
  }

  const loturiCuAlerte = loturi.filter(l =>
    l.durata_zile > 0 && (l.zile_in_faza || 0) >= l.durata_zile
  )

  const totalTaviOcupate = hala.reduce((a, b) => a + b.tavi_ocupate, 0)
  const totalTaviLibere = hala.reduce((a, b) => a + b.tavi_libere, 0)
  const totalCapacitate = hala.reduce((a, b) => a + b.capacitate_tavi, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-green-400">🌿 Mapare Producție</h1>
          <p className="text-gray-500 text-sm">Actualizat: {lastUpdate}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
            ↻ Refresh
          </button>
          <button onClick={() => setShowStartProductie(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16}/> Start Producție
          </button>
        </div>
      </div>

      {/* ALERTE */}
      {loturiCuAlerte.length > 0 && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-3 mb-4">
          <div className="text-red-400 font-medium mb-2">⚠️ {loturiCuAlerte.length} loturi cu faza expirată</div>
          <div className="flex flex-wrap gap-2">
            {loturiCuAlerte.map(l => (
              <span key={l.id} className="bg-red-900 px-2 py-1 rounded-lg text-xs text-red-200 font-medium">
                {l.lot_code} — {l.specie} — {l.faza_curenta}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SUMAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Loturi active', val: loturi.length, color: 'text-green-400', sub: 'în fabrică' },
          { label: 'Tavi ocupate', val: totalTaviOcupate, color: 'text-blue-400', sub: `din ${totalCapacitate} total` },
          { label: 'Tavi libere', val: totalTaviLibere, color: 'text-gray-300', sub: `${totalCapacitate > 0 ? Math.round(totalTaviLibere/totalCapacitate*100) : 0}% disponibil` },
          { label: 'Alerte faze', val: loturiCuAlerte.length, color: loturiCuAlerte.length > 0 ? 'text-red-400' : 'text-green-400', sub: loturiCuAlerte.length > 0 ? 'necesită acțiune' : 'totul ok' },
        ].map(item => (
          <div key={item.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-500 text-xs mb-1">{item.label}</div>
            <div className={`text-3xl font-bold ${item.color}`}>{item.val}</div>
            <div className="text-gray-600 text-xs mt-1">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* LEGENDA */}
      <div className="flex gap-4 mb-4 text-xs text-gray-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-700 border border-gray-600"/><span>Gol</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-900 border border-green-700"/><span>Ocupat parțial</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-900 border border-blue-600"/><span>Plin</span></div>
      </div>

      {/* GRID HALA - SCROLL ORIZONTAL */}
      <div className="overflow-x-auto pb-4">
        <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${Object.keys(module).length}, 160px)`, gap: '12px', minWidth: 'max-content' }}>

          {/* Coloana etichete niveluri */}
          <div>
            <div className="h-12"/> {/* spatiu pentru header modul */}
            {[1,2,3,4,5,6,7].map(n => (
              <div key={n} className="h-24 flex items-center justify-end pr-2">
                <span className="text-gray-500 text-sm font-medium">Nivel {n}</span>
              </div>
            ))}
          </div>

          {/* Module */}
          {Object.entries(module).map(([numModul, pozitii]: any) => (
            <div key={numModul}>
              {/* Header modul */}
              <div className="h-12 flex items-center justify-center bg-gray-700 rounded-xl mb-0">
                <span className="text-green-400 font-bold text-base">Modul {numModul}</span>
              </div>

              {/* Niveluri */}
              {pozitii.sort((a: any, b: any) => a.nivel - b.nivel).map((p: any) => {
                const style = getCardStyle(p)
                const pctOcupat = p.capacitate_tavi > 0 ? (p.tavi_ocupate / p.capacitate_tavi * 100) : 0

                return (
                  <div key={p.shelf_id}
                    onClick={() => setSelectedShelf(p)}
                    className={`h-24 mt-3 rounded-xl border-2 cursor-pointer hover:opacity-80 transition-all p-3 flex flex-col justify-between ${style.border} ${style.bg}`}
                  >
                    {/* Top row */}
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-bold ${style.text}`}>N{p.nivel}</span>
                      {p.nr_loturi_active > 0 && (
                        <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded-full font-medium">
                          {p.nr_loturi_active} lot{p.nr_loturi_active > 1 ? 'uri' : ''}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    {p.tavi_ocupate > 0 ? (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={style.text}>{p.tavi_ocupate} tavi</span>
                          <span className="text-gray-500">{Math.round(pctOcupat)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${style.indicator}`}
                            style={{ width: `${pctOcupat}%` }}
                          />
                        </div>
                        <div className="text-gray-600 text-xs mt-1">{p.tavi_libere} libere</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-gray-700 text-xs">GOL</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL POZITIE */}
      {selectedShelf && (
        <ModalPozitie shelf={selectedShelf} onClose={() => setSelectedShelf(null)} onRefresh={fetchAll}/>
      )}

      {/* MODAL START PRODUCTIE */}
      {showStartProductie && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-600 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-green-400 font-bold text-lg">🌱 Start Producție Nouă</h2>
              <button onClick={() => setShowStartProductie(false)} className="p-1 hover:bg-gray-700 rounded-lg">
                <X size={18} className="text-gray-400"/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block font-medium">Specie *</label>
                <select value={formLot.species_id}
                  onChange={e => setFormLot(p => ({ ...p, species_id: e.target.value }))}
                  className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white">
                  <option value="">Selectează specia...</option>
                  {specii.map(s => (
                    <option key={s.id} value={s.id}>{s.nume} — {s.categorie}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block font-medium">Total tavi</label>
                  <input type="number" min={1}
                    value={formLot.total_tavi}
                    onChange={e => setFormLot(p => ({ ...p, total_tavi: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block font-medium">Plante / tavă</label>
                  <input type="number" min={1}
                    value={formLot.plante_per_tava}
                    onChange={e => setFormLot(p => ({ ...p, plante_per_tava: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block font-medium">Note</label>
                <textarea value={formLot.note}
                  onChange={e => setFormLot(p => ({ ...p, note: e.target.value }))}
                  rows={2} placeholder="Observații despre acest lot..."
                  className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white resize-none"
                />
              </div>

              {formLot.total_tavi > 0 && formLot.plante_per_tava > 0 && (
                <div className="bg-green-950 border border-green-800 rounded-xl p-4">
                  <div className="text-green-400 font-medium text-sm mb-2">Sumar lot</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">Total plante:</div>
                    <div className="text-white font-bold">{formLot.total_tavi * formLot.plante_per_tava}</div>
                    <div className="text-gray-400">Faza inițială:</div>
                    <div className="text-green-400">Germinație</div>
                  </div>
                </div>
              )}

              <button onClick={createLot} disabled={loading || !formLot.species_id}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl font-bold text-sm">
                {loading ? 'Se creează...' : '✅ Creează lot și pornește producția'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}