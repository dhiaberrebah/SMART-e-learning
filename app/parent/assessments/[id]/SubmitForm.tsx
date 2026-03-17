'use client'
import { useState } from 'react'

type Question = {
  id: string
  position: number
  question_type: 'mcq' | 'text'
  prompt: string
  options: string[] | null
  correct_option_index: number | null
  points: number
}

type Submission = {
  id: string
  status: string
  total_score: number | null
  teacher_feedback: string | null
  submitted_at: string | null
  answers: Record<string, any> | null
}

export default function SubmitForm({
  assessmentId,
  studentId,
  questions,
  submission,
  totalPoints,
  onSubmit,
}: {
  assessmentId: string
  studentId: string
  questions: Question[]
  submission: Submission | null
  totalPoints: number
  onSubmit: (formData: FormData) => Promise<void>
}) {
  const isGraded = submission?.status === 'graded'
  const isSubmitted = submission?.status === 'submitted'
  const isReadOnly = isGraded || isSubmitted

  const submittedAnswers: Record<string, any> = submission?.answers ?? {}

  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await onSubmit(fd)
    setLoading(false)
  }

  if (questions.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Répondre à l'évaluation</h2>
        {isGraded && (
          <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
            ✅ Corrigé · {submission?.total_score} / {totalPoints} pts
          </span>
        )}
        {isSubmitted && (
          <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
            ⏳ En attente de correction
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
        <input type="hidden" name="assessment_id" value={assessmentId} />
        <input type="hidden" name="student_id" value={studentId} />

        {questions.map((q, idx) => {
          const isMcq = q.question_type === 'mcq'
          const choices: string[] = isMcq && Array.isArray(q.options) ? q.options : []
          const submittedValue = submittedAnswers[q.id]

          return (
            <div key={q.id} className="px-5 py-5">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">{q.prompt}</p>
                  <p className="text-xs text-gray-400 mb-3">
                    <span className={`px-2 py-0.5 rounded-full ${isMcq ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {isMcq ? 'Choix multiple' : 'Réponse ouverte'}
                    </span>
                    <span className="ml-2">{q.points} pt{Number(q.points) !== 1 ? 's' : ''}</span>
                  </p>

                  {isMcq ? (
                    <div className="space-y-2">
                      {choices.map((opt, oi) => {
                        const isSelectedByStudent = isReadOnly && submittedValue !== undefined && Number(submittedValue) === oi
                        const isCorrect = oi === q.correct_option_index
                        let rowClass = 'bg-gray-50 border border-gray-200'
                        if (isReadOnly && isSelectedByStudent && isGraded) {
                          rowClass = isCorrect
                            ? 'bg-emerald-50 border border-emerald-300'
                            : 'bg-red-50 border border-red-300'
                        } else if (isReadOnly && isSelectedByStudent) {
                          rowClass = 'bg-blue-50 border border-blue-300'
                        } else if (isGraded && isCorrect) {
                          rowClass = 'bg-emerald-50 border border-emerald-200'
                        }

                        return (
                          <label
                            key={oi}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors ${rowClass} ${isReadOnly ? 'pointer-events-none' : 'hover:bg-gray-100'}`}
                          >
                            <input
                              type="radio"
                              name={`answer_${q.id}`}
                              value={oi}
                              disabled={isReadOnly}
                              defaultChecked={isReadOnly ? Number(submittedValue) === oi : false}
                              className="accent-indigo-600"
                              required
                            />
                            <span className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-1 text-gray-800">{opt}</span>
                            {isGraded && isCorrect && (
                              <span className="text-emerald-600 text-xs font-medium">✓ Bonne réponse</span>
                            )}
                            {isGraded && isSelectedByStudent && !isCorrect && (
                              <span className="text-red-500 text-xs font-medium">✗ Votre réponse</span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <textarea
                      name={`answer_${q.id}`}
                      rows={3}
                      disabled={isReadOnly}
                      defaultValue={isReadOnly ? String(submittedValue ?? '') : ''}
                      placeholder="Entrez votre réponse ici…"
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none resize-none disabled:bg-gray-50 disabled:text-gray-600"
                      required
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {!isReadOnly && (
          <div className="px-5 py-4 bg-gray-50">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? 'Envoi en cours…' : 'Soumettre les réponses'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Une fois soumis, votre réponse sera corrigée par l'enseignant.
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
