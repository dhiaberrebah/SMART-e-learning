'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

interface Question {
  id: string
  type: 'multiple_choice' | 'text' | 'file'
  prompt: string
  options: string[]
  correct_option_index: number | null
  points: number
}

export default function AddAssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [allowAttachments, setAllowAttachments] = useState(false)

  const addQuestion = () => {
    setQuestions([...questions, {
      id: crypto.randomUUID(),
      type: 'multiple_choice',
      prompt: '',
      options: ['', '', '', ''],
      correct_option_index: 0,
      points: 1,
    }])
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => q.id === id ? { ...q, ...updates } : q))
  }

  const updateOption = (qId: string, index: number, value: string) => {
    setQuestions(questions.map((q) => {
      if (q.id !== qId) return q
      const opts = [...q.options]
      opts[index] = value
      return { ...q, options: opts }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Le titre est requis.'); return }
    setLoading(true)
    setError('')

    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: assessment, error: aErr } = await supabase
      .from('assessments')
      .insert({ title, description: description || null, status, allow_attachments: allowAttachments, teacher_id: user.id })
      .select('id')
      .single()

    if (aErr || !assessment) { setError(aErr?.message ?? 'Erreur création évaluation'); setLoading(false); return }

    if (questions.length > 0) {
      const qRecords = questions.map((q, pos) => ({
        assessment_id: assessment.id,
        position: pos + 1,
        question_type: q.type,
        prompt: q.prompt,
        options: q.type === 'multiple_choice' ? q.options.filter(Boolean) : null,
        correct_option_index: q.type === 'multiple_choice' ? q.correct_option_index : null,
        points: q.points,
      }))
      const { error: qErr } = await supabase.from('assessment_questions').insert(qRecords)
      if (qErr) { setError(qErr.message); setLoading(false); return }
    }

    router.push('/teacher/assessments')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/teacher/assessments" className="text-sm text-blue-600 hover:underline">← Évaluations</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nouvelle évaluation</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">❌ {error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assessment info */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations générales</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="ex: Évaluation de mi-trimestre - Mathématiques"
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Instructions pour les élèves…"
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>
          <div className="flex gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut initial</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="draft">Brouillon</option>
                <option value="published">Publier directement</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={allowAttachments} onChange={(e) => setAllowAttachments(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600" />
                Autoriser les pièces jointes
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Questions ({questions.length})</h2>
            <button type="button" onClick={addQuestion}
              className="px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              + Ajouter une question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Question {idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <select value={q.type} onChange={(e) => updateQuestion(q.id, { type: e.target.value as Question['type'] })}
                      className="border border-gray-400 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500">
                      <option value="multiple_choice">Choix multiple</option>
                      <option value="text">Réponse texte</option>
                      <option value="file">Fichier</option>
                    </select>
                    <input type="number" value={q.points} min={0.5} step={0.5} onChange={(e) => updateQuestion(q.id, { points: parseFloat(e.target.value) })}
                      className="w-16 border border-gray-400 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500" />
                    <span className="text-xs text-gray-400">pt{q.points !== 1 ? 's' : ''}</span>
                    <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <textarea value={q.prompt} onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                  placeholder="Saisir la question…" rows={2}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none mb-3" />
                {q.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Options (cocher la bonne réponse) :</p>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct_${q.id}`} checked={q.correct_option_index === oi}
                          onChange={() => updateQuestion(q.id, { correct_option_index: oi })}
                          className="w-4 h-4 text-emerald-600" />
                        <input type="text" value={opt} onChange={(e) => updateOption(q.id, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 border border-gray-400 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'text' && (
                  <p className="text-xs text-gray-400 italic">L'élève saisira sa réponse en texte libre.</p>
                )}
                {q.type === 'file' && (
                  <p className="text-xs text-gray-400 italic">L'élève devra joindre un fichier.</p>
                )}
              </div>
            ))}
            {questions.length === 0 && (
              <button type="button" onClick={addQuestion}
                className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-sm">
                Cliquer pour ajouter une question
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
            {loading ? 'Enregistrement…' : 'Enregistrer l\'évaluation'}
          </button>
          <a href="/teacher/assessments" className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Annuler
          </a>
        </div>
      </form>
    </div>
  )
}
