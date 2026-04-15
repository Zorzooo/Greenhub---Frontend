'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { MessageSquare, User, Bot, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function IstoricChat() {
  const [istoric, setIstoric] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/chat/istoric`)
      .then(r => {
        setIstoric(r.data.reverse())
        setLoading(false)
      })
  }, [])

  // Grupam mesajele in conversatii
  const conversatii: any[][] = []
  let conversatieCurenta: any[] = []

  istoric.forEach((msg, i) => {
    conversatieCurenta.push(msg)
    if (msg.rol === 'ai') {
      conversatii.push([...conversatieCurenta])
      conversatieCurenta = []
    }
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20}/>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-green-400">📋 Istoric Conversații AI</h1>
          <p className="text-gray-400 text-sm">{conversatii.length} conversații salvate</p>
        </div>
      </div>

      {loading && (
        <div className="text-center text-gray-400 mt-20">Se încarcă...</div>
      )}

      {/* CONVERSATII */}
      <div className="max-w-3xl mx-auto space-y-6">
        {conversatii.map((conv, i) => (
          <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            
            {/* Header conversatie */}
            <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-green-400"/>
                <span className="text-gray-300 text-sm font-medium">
                  Conversație {conversatii.length - i}
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                {new Date(conv[0].time).toLocaleString('ro-RO')}
              </span>
            </div>

            {/* Mesaje */}
            <div className="p-4 space-y-3">
              {conv.map((msg, j) => (
                <div key={j} className={`flex gap-3 ${msg.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {msg.rol === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={14}/>
                    </div>
                  )}

                  <div className={`max-w-xl rounded-xl px-4 py-3 text-sm ${
                    msg.rol === 'user' 
                      ? 'bg-green-700 text-white' 
                      : 'bg-gray-700 text-gray-200'
                  }`}>
                    {msg.mesaj}
                  </div>

                  {msg.rol === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={14}/>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>
        ))}

        {!loading && conversatii.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-30"/>
            <p>Nu există conversații salvate încă.</p>
            <p className="text-sm mt-1">Începe o conversație din dashboard.</p>
          </div>
        )}
      </div>

    </div>
  )
}