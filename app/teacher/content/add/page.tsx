'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AddContentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [useExternalUrl, setUseExternalUrl] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [loaded, setLoaded] = useState(false)

  const loadData = async () => {
    if (loaded) return
    setLoaded(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: cls }, { data: subs }] = await Promise.all([
      supabase.from('classes').select('id, name').eq('teacher_id', user.id).order('name'),
      supabase.from('subjects').select('id, name, class_id').order('name'),
    ])
    setClasses(cls ?? [])
    setSubjects(subs ?? [])
  }

  const filteredSubjects = selectedClass ? subjects.filter((s) => s.class_id === selectedClass) : subjects

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
      setUploadProgress(0)
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: upErr } = await supabase.storage
        .from('content')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (upErr) {
        setError(`Erreur upload : ${upErr.message}. Assurez-vous que le bucket "content" existe dans Supabase Storage.`)
        setLoading(false)
        setUploadProgress(null)
        return
      }

      const { data: urlData } = supabase.storage.from('content').getPublicUrl(uploadData.path)
      filePath = urlData.publicUrl
      mimeType = file.type
      sizeBytes = file.size
      setUploadProgress(100)
    } else if (useExternalUrl && externalUrl.trim()) {
      filePath = externalUrl.trim()
    }

    const { error: dbErr } = await supabase.from('pedagogical_contents').insert({
      title,
      description: description || null,
      teacher_id: user.id,
      class_id: selectedClass || null,
      subject_id: selectedSubject || null,
      file_path: filePath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
    })

    if (dbErr) { setError(dbErr.message); setLoading(false); setUploadProgress(null); return }
    router.push('/teacher/content')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto" onFocus={loadData}>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Classe</label>
              <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject('') }}
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Toutes les classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Matière</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Toutes les matières</option>
                {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Objectifs, contenu, instructions…"
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>

          {/* File or URL toggle */}
          <div>
            <div className="flex gap-4 mb-3">
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
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                {file ? (
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }} className="text-red-400 hover:text-red-600 text-xs mt-1">Supprimer</button>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <div className="text-2xl mb-1">📁</div>
                    <p className="text-sm">Cliquer pour sélectionner un fichier</p>
                    <p className="text-xs mt-1">PDF, Word, Image, Vidéo…</p>
                  </div>
                )}
                <input ref={fileRef} type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
            ) : (
              <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://youtube.com/... ou lien vers une ressource"
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            )}
          </div>

          {uploadProgress !== null && uploadProgress < 100 && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            ⚠️ Pour le téléversement de fichiers, créez un bucket public nommé <strong>content</strong> dans Supabase Storage.
          </div>

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
