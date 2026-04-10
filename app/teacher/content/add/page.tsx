'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AddContentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [useExternalUrl, setUseExternalUrl] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: directCls }, { data: subjectRows }] = await Promise.all([
        supabase.from('classes').select('id, name').eq('teacher_id', user.id),
        supabase.from('subjects').select('class_id').eq('teacher_id', user.id),
      ])
      const directIds = new Set((directCls ?? []).map((c: any) => c.id))
      const extraIds = [...new Set((subjectRows ?? []).map((s: any) => s.class_id).filter(Boolean))].filter((id: string) => !directIds.has(id))
      const extra = extraIds.length > 0
        ? (await supabase.from('classes').select('id, name').in('id', extraIds)).data ?? []
        : []
      const all = [...(directCls ?? []), ...extra].sort((a: any, b: any) => a.name.localeCompare(b.name))
      setClasses(all)

      // Pre-select the class that owns the subject from URL
    }
    load()
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Le titre est requis.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let filePath: string | null = null
    let mimeType: string | null = null
    let sizeBytes: number | null = null

    if (!useExternalUrl && file) {
      setUploadProgress('uploading')
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Erreur lors de l\'upload')
        setLoading(false)
        setUploadProgress('idle')
        return
      }

      filePath = json.url
      mimeType = json.mimeType
      sizeBytes = json.size
      setUploadProgress('done')
    } else if (useExternalUrl && externalUrl.trim()) {
      filePath = externalUrl.trim()
    }

    const { error: dbErr } = await supabase.from('pedagogical_contents').insert({
      title,
      description: description || null,
      teacher_id: user.id,
      class_id: selectedClass || null,
      file_path: filePath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
    })

    if (dbErr) { setError(dbErr.message); setLoading(false); setUploadProgress('idle'); return }
    router.push('/teacher/content')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <a href="/teacher/content" className="text-sm text-blue-600 hover:underline">← Cours & Ressources</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Ajouter une ressource</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">❌ {error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="ex: Chapitre 3 — Les fractions"
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Classe</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Toutes les classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Objectifs, contenu, instructions…"
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>

          {/* File or URL toggle */}
          <div>
            <div className="flex gap-6 mb-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" checked={!useExternalUrl} onChange={() => setUseExternalUrl(false)} className="text-blue-600" />
                Téléverser un fichier
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" checked={useExternalUrl} onChange={() => setUseExternalUrl(true)} className="text-blue-600" />
                Lien externe (URL)
              </label>
            </div>

            {!useExternalUrl ? (
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/30'
                }`}>
                {file ? (
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">📄 {file.name}</p>
                    <p className="text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setUploadProgress('idle') }}
                      className="text-red-400 hover:text-red-600 text-xs mt-1">
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <div className="text-3xl mb-2">📁</div>
                    <p className="text-sm font-medium">Cliquer pour sélectionner un fichier</p>
                    <p className="text-xs mt-1 text-gray-400">PDF, Word, Image, Vidéo, Audio…</p>
                  </div>
                )}
                <input ref={fileRef} type="file" className="sr-only"
                  onChange={(e) => { setFile(e.target.files?.[0] ?? null); setUploadProgress('idle') }} />
              </div>
            ) : (
              <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://youtube.com/... ou lien vers une ressource"
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            )}
          </div>

          {/* Upload progress */}
          {uploadProgress === 'uploading' && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Envoi en cours…
            </div>
          )}
          {uploadProgress === 'done' && (
            <p className="text-sm text-emerald-600">✅ Fichier enregistré localement.</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
              {loading ? 'Publication…' : 'Publier la ressource'}
            </button>
            <a href="/teacher/content" className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Annuler
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
