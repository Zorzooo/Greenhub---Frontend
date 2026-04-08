'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, CheckCircle, Clock, AlertTriangle, X, Bot } from 'lucide-react'

const API = 'http://localhost:8000'

const TIPURI = [
  { value: 'observatie', label: '👁️ Observație', color: 'bg-blue-900 border-blue-700' },
  { value: 'problema', label: '⚠️ Problemă', color: 'bg-red-900 border-red-700' },
  { value: 'actiune', label: '🔧 Acțiune', color: 'bg-green-900 border-green-700' },
  { value: 'reglaj', label: '⚙️ Reglaj', color: 'bg-yellow-900 border-yellow-700' },
  { value: 'recoltare', label: '🌿 Recoltare', color: 'bg-purple-900 border-purple-700' },
]

export default function Jurnal() {
  const [logs, setLogs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiFeedback, setAiFeedback] = useState('')
  const [form, setForm] = useState({
    tip: 'observatie',
    titlu: '',
    descriere: '',
    actiune_luata: '',
    rezultat: '',
    operator: 'operator'
  })

  const fetchLogs = async () => {
    const res = await axios.get(`${API}/api/jurnal`)
    setLogs(res.data)
  }

  useEffect(() => { fetchLogs() }, [])

  const getTipConfig = (tip: string) => TIPURI.find(t => t.value === tip) || TIPURI[0]

  const submitForm = async () => {
    if (!form.titlu.trim()) return
    setLoading(true)
    setAiFeedback('')
    try {
      const res = await axios.post(`${API}/api/jurnal`, form)
      setAiFeedback(res.data.ai_feedback || '')
      setForm({ tip: 'observatie', titlu: '', descriere: '', actiune_luata: '', rezultat: '', operator: 'operator' })
      fetchLogs()
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const rezolva = async (id: number) => {
    await axios.put(`${API}/api/jurnal/${id}/rezolva`)
    fetchLogs()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-400">📋 Jurnal Operator</h1>
          <p className="text-gray-500 text-sm">{logs.filter(l => !l.rezolvat).length} observații active</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setAiFeedback('') }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16}/> Adaugă observație
        </button>
      </div>

      {/* FORM ADAUGARE */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-600 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-green-400 font-semibold">Observație nouă</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400"/></button>
          </div>

          {/* Tip */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Tip</label>
            <div className="flex flex-wrap gap-2">
              {TIPURI.map(t => (
                <button key={t.value}
                  onClick={() => setForm(prev => ({ ...prev, tip: t.value }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.tip === t.value ? t.color + ' text-white' : 'border-gray-600 text-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Titlu */}
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">Titlu *</label>
            <input
              type="text"
              value={form.titlu}
              onChange={e => setForm(prev => ({ ...prev, titlu: e.target.value }))}
              placeholder="Ex: EC scăzut în bazin, Frunze galbene Modul 3..."
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>

          {/* Descriere */}
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">Descriere</label>
            <textarea
              value={form.descriere}
              onChange={e => setForm(prev => ({ ...prev, descriere: e.target.value }))}
              placeholder="Descrie situația observată..."
              rows={3}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none resize-none"
            />
          </div>

          {/* Actiune */}
          <div className="mb-3">
            <label className="text-gray-400 text-xs mb-1 block">Acțiune luată</label>
            <textarea
              value={form.actiune_luata}
              onChange={e => setForm(prev => ({ ...prev, actiune_luata: e.target.value }))}
              placeholder="Ce ai făcut pentru a rezolva situația?"
              rows={2}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none resize-none"
            />
          </div>

          {/* Rezultat */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-1 block">Rezultat</label>
            <input
              type="text"
              value={form.rezultat}
              onChange={e => setForm(prev => ({ ...prev, rezultat: e.target.value }))}
              placeholder="Care a fost rezultatul acțiunii?"
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>

          <button
            onClick={submitForm}
            disabled={loading || !form.titlu.trim()}
            className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 font-medium text-sm"
          >
            {loading ? 'Se salvează și se generează feedback AI...' : '💾 Salvează + Feedback AI'}
          </button>

          {/* AI Feedback */}
          {aiFeedback && (
            <div className="mt-4 bg-gray-700 rounded-lg p-4 border border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={16} className="text-green-400"/>
                <span className="text-green-400 text-sm font-medium">Feedback AI Headgrower</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{aiFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* LISTA LOGS */}
      <div className="space-y-3">
        {logs.length === 0 && (
          <div className="text-center text-gray-600 py-20">
            <div className="text-4xl mb-3">📋</div>
            <p>Nicio observație înregistrată încă.</p>
            <p className="text-sm mt-1">Apasă "Adaugă observație" pentru a începe.</p>
          </div>
        )}

        {logs.map(log => {
          const tipConfig = getTipConfig(log.tip)
          const isExpired = !log.rezolvat
          return (
            <div key={log.id} className={`bg-gray-800 rounded-xl p-4 border ${log.rezolvat ? 'border-gray-700 opacity-60' : 'border-gray-600'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs border ${tipConfig.color}`}>
                    {tipConfig.label}
                  </span>
                  <span className="text-white font-medium text-sm">{log.titlu}</span>
                  {log.rezolvat && (
                    <span className="text-green-400 text-xs flex items-center gap-1">
                      <CheckCircle size={12}/> Rezolvat
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">
                    {new Date(log.time).toLocaleString('ro-RO')}
                  </span>
                  {!log.rezolvat && (
                    <button
                      onClick={() => rezolva(log.id)}
                      className="px-2 py-1 bg-green-800 hover:bg-green-700 rounded text-xs text-green-300"
                    >
                      ACK
                    </button>
                  )}
                </div>
              </div>

              {log.descriere && (
                <p className="text-gray-400 text-sm mb-2">{log.descriere}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {log.actiune_luata && (
                  <div className="bg-gray-700 rounded p-2">
                    <div className="text-gray-500 text-xs mb-1">Acțiune luată</div>
                    <div className="text-gray-300 text-sm">{log.actiune_luata}</div>
                  </div>
                )}
                {log.rezultat && (
                  <div className="bg-gray-700 rounded p-2">
                    <div className="text-gray-500 text-xs mb-1">Rezultat</div>
                    <div className="text-gray-300 text-sm">{log.rezultat}</div>
                  </div>
                )}
              </div>

              {log.ai_feedback && (
                <div className="mt-2 bg-gray-900 rounded-lg p-3 border border-green-900">
                  <div className="flex items-center gap-1 mb-1">
                    <Bot size={12} className="text-green-400"/>
                    <span className="text-green-400 text-xs font-medium">Feedback AI</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{log.ai_feedback}</p>
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600 text-xs">Operator: {log.operator}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}