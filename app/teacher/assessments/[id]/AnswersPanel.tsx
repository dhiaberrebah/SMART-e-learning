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

export default function AnswersPanel({
  answers,
  questions,
}: {
  answers: Record<string, any>
  questions: Question[]
}) {
  const [open, setOpen] = useState(false)

  const hasAnswers = Object.keys(answers).length > 0
  if (!hasAnswers) return null

  // Auto-score MCQ based on correct_option_index
  let autoScore = 0
  let mcqTotal = 0
  for (const q of questions) {
    if (q.question_type === 'mcq' && q.correct_option_index !== null) {
      mcqTotal += q.points
      const studentAnswer = answers[q.id]
      if (studentAnswer !== undefined && Number(studentAnswer) === q.correct_option_index) {
        autoScore += q.points
      }
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
      >
        {open ? '▲ Masquer les réponses' : '▼ Voir les réponses soumises'}
        {mcqTotal > 0 && (
          <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
            MCQ : {autoScore}/{mcqTotal} pts auto
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
          {questions.map((q, idx) => {
            const studentAnswer = answers[q.id]
            if (studentAnswer === undefined) return null

            const isMcq = q.question_type === 'mcq'
            const choices: string[] = isMcq && Array.isArray(q.options) ? q.options : []
            const selectedIndex = isMcq ? Number(studentAnswer) : null
            const isCorrect = isMcq && selectedIndex === q.correct_option_index

            return (
              <div key={q.id} className="text-xs">
                <p className="text-gray-500 font-medium mb-1">
                  Q{idx + 1}. {q.prompt}
                </p>
                {isMcq ? (
                  <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${isCorrect ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <span className="font-bold">{isCorrect ? '✓' : '✗'}</span>
                    <span>{choices[selectedIndex ?? -1] ?? `Option ${selectedIndex}`}</span>
                    {!isCorrect && (
                      <span className="ml-auto text-gray-500 text-xs">
                        Attendu : {choices[q.correct_option_index ?? -1]}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-md px-2 py-1.5 text-gray-700 italic">
                    "{String(studentAnswer)}"
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
