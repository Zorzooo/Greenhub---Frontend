'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, X, Edit, ChevronDown, ChevronUp, Leaf } from 'lucide-react'

const API = 'http://localhost:8000'

const CATEGORII = ['Salată', 'Ierburi aromatice', 'Microgreens', 'Legume', 'Flori', 'Altele']

const FAZE_PREDEFINITE = ['Germinație', 'Răsad', 'Creștere vegetativă', 'Maturare', 'Recoltare']

interface Faza {
  nume: string
  durata_zile: number
  descriere: string
  plante_per_tava: number
  notificare_cu_zile_inainte: number
  temp_min: number | ''
  temp_max: number | ''
  umid_min: number | ''
  umid_max: number | ''
  ec_min: number | ''
  ec_max: number | ''
  ph_min: number | ''
  ph_max: number | ''
}

const fazaGoala = (): Faza => ({
  nume: '',
  durata_zile: 0,
  descriere: '',
  plante_per_tava: 20,
  notificare_cu_zile_inainte: 1,
  temp_min: '',
  temp_max: '',
  umid_min: '',
  umid_max: '',
  ec_min: '',
  ec_max: '',
  ph_min: '',
  ph_max: '',
})

export default function Specii() {
  const [specii, setSpecii] = useState<any[]>([])
  const [selectedSpecie, setSelectedSpecie] = useState<any>(null)
  const [fazeSpecie, setFazeSpecie] = useState<any[]>([])
  const [showFormular, setShowFormular] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [eroare, setEroare] = useState('')
  const [succes, setSucces] = useState('')

  const [formSpecie, setFormSpecie] = useState({
    nume: '',
    categorie: '',
    descriere: '',
    note: '',
  })
  const [faze, setFaze] = useState<Faza[]>([fazaGoala()])

  const fetchSpecii = async () => {
    const res = await axios.get(`${API}/api/specii`)
    setSpecii(res.data)
  }

  const fetchFaze = async (species_id: number) => {
    const res = await axios.get(`${API}/api/specii/${species_id}/faze`)
    setFazeSpecie(res.data)
  }

  useEffect(() => { fetchSpecii() }, [])

  const selecteazaSpecie = async (specie: any) => {
    if (selectedSpecie?.id === specie.id) {
      setSelectedSpecie(null)
      setFazeSpecie([])
    } else {
      setSelectedSpecie(specie)
      await fetchFaze(specie.id)
    }
  }

  const adaugaFaza = () => setFaze(prev => [...prev, fazaGoala()])

  const stergeUltimaFaza = () => {
    if (faze.length > 1) setFaze(prev => prev.slice(0, -1))
  }

  const updateFaza = (idx: number, field: keyof Faza, val: any) => {
    setFaze(prev => prev.map((f, i) => i === idx ? { ...f, [field]: val } : f))
  }

  const reseteazaFormular = () => {
    setFormSpecie({ nume: '', categorie: '', descriere: '', note: '' })
    setFaze([fazaGoala()])
    setEditMode(false)
    setEroare('')
    setSucces('')
  }

  const deschideEditare = (specie: any, fazeCurente: any[]) => {
    setFormSpecie({
      nume: specie.nume,
      categorie: specie.categorie || '',
      descriere: specie.descriere || '',
      note: specie.note || '',
    })
    setFaze(fazeCurente.length > 0 ? fazeCurente.map(f => ({
      nume: f.nume,
      durata_zile: f.durata_zile,
      descriere: f.descriere || '',
      plante_per_tava: f.plante_per_tava || 20,
      notificare_cu_zile_inainte: f.notificare_cu_zile_inainte || 1,
      temp_min: f.temp_min ?? '',
      temp_max: f.temp_max ?? '',
      umid_min: f.umid_min ?? '',
      umid_max: f.umid_max ?? '',
      ec_min: f.ec_min ?? '',
      ec_max: f.ec_max ?? '',
      ph_min: f.ph_min ?? '',
      ph_max: f.ph_max ?? '',
    })) : [fazaGoala()])
    setEditMode(true)
    setShowFormular(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salveaza = async () => {
    if (!formSpecie.nume.trim()) { setEroare('Numele speciei este obligatoriu'); return }
    if (faze.some(f => !f.nume.trim())) { setEroare('Toate fazele trebuie să aibă un nume'); return }

    setLoading(true)
    setEroare('')
    try {
      await axios.post(`${API}/api/specii`, {
        ...formSpecie,
        faze: faze.map(f => ({
          ...f,
          temp_min: f.temp_min === '' ? null : Number(f.temp_min),
          temp_max: f.temp_max === '' ? null : Number(f.temp_max),
          umid_min: f.umid_min === '' ? null : Number(f.umid_min),
          umid_max: f.umid_max === '' ? null : Number(f.umid_max),
          ec_min: f.ec_min === '' ? null : Number(f.ec_min),
          ec_max: f.ec_max === '' ? null : Number(f.ec_max),
          ph_min: f.ph_min === '' ? null : Number(f.ph_min),
          ph_max: f.ph_max === '' ? null : Number(f.ph_max),
        })),
        operator: 'operator'
      })
      setSucces(editMode ? 'Specia a fost actualizată!' : 'Specia a fost adăugată!')
      setTimeout(() => {
        setShowFormular(false)
        reseteazaFormular()
        fetchSpecii()
      }, 1500)
    } catch (e) {
      setEroare('Eroare la salvare. Încearcă din nou.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-400">🌿 Catalog Specii</h1>
          <p className="text-gray-500 text-sm">{specii.length} specii înregistrate</p>
        </div>
        <button
          onClick={() => {
            if (showFormular) {
              setShowFormular(false)
              reseteazaFormular()
            } else {
              setShowFormular(true)
              setEditMode(false)
              reseteazaFormular()
            }
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showFormular ? <><X size={16}/> Anulează</> : <><Plus size={16}/> Specie Nouă</>}
        </button>
      </div>

      {/* FORMULAR ADAUGARE / EDITARE */}
      {showFormular && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <h2 className="text-green-400 font-bold text-lg mb-5">
            {editMode ? '✏️ Editare specie' : '🌱 Specie nouă'}
          </h2>

          {eroare && (
            <div className="bg-red-950 border border-red-700 rounded-xl p-3 mb-4 text-red-300 text-sm">
              ⚠️ {eroare}
            </div>
          )}
          {succes && (
            <div className="bg-green-950 border border-green-700 rounded-xl p-3 mb-4 text-green-300 text-sm">
              ✅ {succes}
            </div>
          )}

          {/* Info de baza */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Nume specie *</label>
              <input
                value={formSpecie.nume}
                onChange={e => setFormSpecie(p => ({ ...p, nume: e.target.value }))}
                placeholder="ex: Salată Iceberg"
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Categorie</label>
              <select
                value={formSpecie.categorie}
                onChange={e => setFormSpecie(p => ({ ...p, categorie: e.target.value }))}
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white outline-none"
              >
                <option value="">Selectează categoria...</option>
                {CATEGORII.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Descriere</label>
              <textarea
                value={formSpecie.descriere}
                onChange={e => setFormSpecie(p => ({ ...p, descriere: e.target.value }))}
                placeholder="Descriere generală..."
                rows={2}
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Note</label>
              <textarea
                value={formSpecie.note}
                onChange={e => setFormSpecie(p => ({ ...p, note: e.target.value }))}
                placeholder="Observații, sfaturi..."
                rows={2}
                className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white outline-none resize-none"
              />
            </div>
          </div>

          {/* FAZE */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold">Faze de creștere</h3>
              <div className="flex gap-2">
                <button
                  onClick={stergeUltimaFaza}
                  disabled={faze.length <= 1}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs disabled:opacity-40"
                >
                  − Șterge ultima
                </button>
                <button
                  onClick={adaugaFaza}
                  className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded-lg text-xs"
                >
                  + Adaugă fază
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {faze.map((faza, idx) => (
                <div key={idx} className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                  <div className="text-green-400 text-xs font-bold mb-3">FAZA {idx + 1}</div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="col-span-2">
                      <label className="text-gray-400 text-xs mb-1 block">Nume fază *</label>
                      <input
                        value={faza.nume}
                        onChange={e => updateFaza(idx, 'nume', e.target.value)}
                        placeholder="ex: Germinație"
                        list={`faze-${idx}`}
                        className="w-full bg-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                      <datalist id={`faze-${idx}`}>
                        {FAZE_PREDEFINITE.map(f => <option key={f} value={f}/>)}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Durată (zile)</label>
                      <input
                        type="number" min={0}
                        value={faza.durata_zile}
                        onChange={e => updateFaza(idx, 'durata_zile', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Plante/tavă</label>
                      <input
                        type="number" min={1} max={20}
                        value={faza.plante_per_tava}
                        onChange={e => updateFaza(idx, 'plante_per_tava', parseInt(e.target.value) || 20)}
                        className="w-full bg-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Parametri optimi */}
                  <div className="bg-gray-800 rounded-lg p-3 mb-3">
                    <div className="text-gray-400 text-xs font-medium mb-2">📊 Parametri optimi (opțional — lasă gol dacă nu știi)</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">🌡️ Temp min (°C)</label>
                        <input
                          type="number" step="0.5"
                          value={faza.temp_min}
                          onChange={e => updateFaza(idx, 'temp_min', e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">🌡️ Temp max (°C)</label>
                        <input
                          type="number" step="0.5"
                          value={faza.temp_max}
                          onChange={e => updateFaza(idx, 'temp_max', e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">💧 Umid min (%)</label>
                        <input
                          type="number" min={0} max={100}
                          value={faza.umid_min}
                          onChange={e => updateFaza(idx, 'umid_min', e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">💧 Umid max (%)</label>
                        <input
                          type="number" min={0} max={100}
                          value={faza.umid_max}
                          onChange={e => updateFaza(idx, 'umid_max', e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">⚡ EC min (mS/cm)</label>
                        <input
                          type="number" step="0.1" min={0}
                          value={faza.ec_min}
                          onChange={e => updateFaza(idx, 'ec_min', e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">⚡ EC max (mS/cm)</label>
                        <input
                          type="number" step="0.1" min={0}
                          value={faza.ec_max}
                          onChange={e => updateFaza(idx, 'ec_max', e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">🧪 pH min</label>
                        <input
                          type="number" step="0.1" min={0} max={14}
                          value={faza.ph_min}
                          onChange={e => updateFaza(idx, 'ph_min', e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">🧪 pH max</label>
                        <input
                          type="number" step="0.1" min={0} max={14}
                          value={faza.ph_max}
                          onChange={e => updateFaza(idx, 'ph_max', e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Descriere fază</label>
                      <textarea
                        value={faza.descriere}
                        onChange={e => updateFaza(idx, 'descriere', e.target.value)}
                        placeholder="Detalii despre această fază..."
                        rows={2}
                        className="w-full bg-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Notificare cu (zile înainte)</label>
                      <input
                        type="number" min={0} max={7}
                        value={faza.notificare_cu_zile_inainte}
                        onChange={e => updateFaza(idx, 'notificare_cu_zile_inainte', parseInt(e.target.value) || 1)}
                        className="w-full bg-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                      <p className="text-gray-600 text-xs mt-1">Alertă înainte de expirarea fazei</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={salveaza}
              disabled={loading}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl font-bold text-sm"
            >
              {loading ? 'Se salvează...' : editMode ? '✅ Salvează modificările' : '✅ Adaugă specia'}
            </button>
            <button
              onClick={() => { setShowFormular(false); reseteazaFormular() }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm"
            >
              Anulează
            </button>
          </div>
        </div>
      )}

      {/* LISTA SPECII */}
      {specii.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Leaf size={48} className="mx-auto mb-3 opacity-30"/>
          <p className="text-lg">Nu există specii înregistrate</p>
          <p className="text-sm mt-1">Adaugă prima specie folosind butonul de mai sus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {specii.map(specie => (
            <div key={specie.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">

              {/* Header specie */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750"
                onClick={() => selecteazaSpecie(specie)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🌿</div>
                  <div>
                    <div className="text-white font-semibold">{specie.nume}</div>
                    <div className="flex gap-2 mt-0.5">
                      {specie.categorie && (
                        <span className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded-full">
                          {specie.categorie}
                        </span>
                      )}
                      <span className="text-gray-500 text-xs">{specie.nr_faze} faze</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      selecteazaSpecie(specie)
                      setTimeout(() => deschideEditare(specie, fazeSpecie), 300)
                    }}
                    className="p-2 bg-gray-700 hover:bg-blue-800 rounded-lg transition-colors"
                  >
                    <Edit size={14} className="text-gray-400"/>
                  </button>
                  {selectedSpecie?.id === specie.id
                    ? <ChevronUp size={18} className="text-gray-400"/>
                    : <ChevronDown size={18} className="text-gray-400"/>
                  }
                </div>
              </div>

              {/* Detalii specie expandate */}
              {selectedSpecie?.id === specie.id && (
                <div className="border-t border-gray-700 p-4">

                  {specie.descriere && (
                    <p className="text-gray-400 text-sm mb-4">{specie.descriere}</p>
                  )}

                  {fazeSpecie.length === 0 ? (
                    <p className="text-gray-600 text-sm text-center py-4">Nu există faze definite</p>
                  ) : (
                    <div className="space-y-3">
                      {fazeSpecie.map((faza, idx) => (
                        <div key={faza.id} className="bg-gray-700 rounded-xl p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-green-800 text-green-200 text-xs font-bold px-2 py-1 rounded-full">
                                Faza {idx + 1}
                              </span>
                              <span className="text-white font-semibold">{faza.nume}</span>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-400">
                              {faza.durata_zile > 0 && (
                                <span>⏱️ {faza.durata_zile} zile</span>
                              )}
                              {faza.plante_per_tava && (
                                <span>🌱 {faza.plante_per_tava} plante/tavă</span>
                              )}
                            </div>
                          </div>

                          {/* Parametri optimi */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                            {(faza.temp_min != null || faza.temp_max != null) && (
                              <div className="bg-gray-800 rounded-lg p-2 text-center">
                                <div className="text-gray-500 text-xs">🌡️ Temp</div>
                                <div className="text-orange-400 font-bold text-sm">
                                  {faza.temp_min ?? '—'} – {faza.temp_max ?? '—'} °C
                                </div>
                              </div>
                            )}
                            {(faza.umid_min != null || faza.umid_max != null) && (
                              <div className="bg-gray-800 rounded-lg p-2 text-center">
                                <div className="text-gray-500 text-xs">💧 Umiditate</div>
                                <div className="text-blue-400 font-bold text-sm">
                                  {faza.umid_min ?? '—'} – {faza.umid_max ?? '—'} %
                                </div>
                              </div>
                            )}
                            {(faza.ec_min != null || faza.ec_max != null) && (
                              <div className="bg-gray-800 rounded-lg p-2 text-center">
                                <div className="text-gray-500 text-xs">⚡ EC</div>
                                <div className="text-purple-400 font-bold text-sm">
                                  {faza.ec_min ?? '—'} – {faza.ec_max ?? '—'} mS/cm
                                </div>
                              </div>
                            )}
                            {(faza.ph_min != null || faza.ph_max != null) && (
                              <div className="bg-gray-800 rounded-lg p-2 text-center">
                                <div className="text-gray-500 text-xs">🧪 pH</div>
                                <div className="text-cyan-400 font-bold text-sm">
                                  {faza.ph_min ?? '—'} – {faza.ph_max ?? '—'}
                                </div>
                              </div>
                            )}
                          </div>

                          {faza.descriere && (
                            <p className="text-gray-500 text-xs">{faza.descriere}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => deschideEditare(specie, fazeSpecie)}
                    className="mt-4 w-full py-2 bg-blue-800 hover:bg-blue-700 rounded-xl text-sm text-blue-200 font-medium flex items-center justify-center gap-2"
                  >
                    <Edit size={14}/> Editează specia
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}