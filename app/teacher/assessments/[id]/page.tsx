import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import AnswersPanel from './AnswersPanel'

async function gradeSubmission(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const submissionId = formData.get('submission_id') as string
  const totalScore = parseFloat(formData.get('total_score') as string)
  const feedback = formData.get('teacher_feedback') as string
  const assessmentId = formData.get('assessment_id') as string

  await db.from('assessment_submissions').update({
    total_score: isNaN(totalScore) ? null : totalScore,
    teacher_feedback: feedback || null,
    status: 'graded',
  }).eq('id', submissionId)

  redirect(`/teacher/assessments/${assessmentId}?graded=1`)
}

export default async function AssessmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ graded?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const { data: assessment } = await db
    .from('assessments')
    .select('id, title, description, status, allow_attachments, created_at, teacher_id')
    .eq('id', id)
    .eq('teacher_id', user!.id)
    .single()

  if (!assessment) notFound()

  const [{ data: questions }, { data: submissions }, { data: assignments }] = await Promise.all([
    db.from('assessment_questions').select('*').eq('assessment_id', id).order('position'),
    db.from('assessment_submissions')
      .select('id, status, total_score, teacher_feedback, submitted_at, answers, student:students(id, full_name, student_number)')
      .eq('assessment_id', id)
      .order('submitted_at', { ascending: false }),
    db.from('assessment_assignments').select('id, class_id, due_at, class:classes(name)').eq('assessment_id', id),
  ])

  const totalPoints = (questions ?? []).reduce((sum: number, q: any) => sum + (q.points ?? 0), 0)
  const gradedCount = (submissions ?? []).filter((s: any) => s.status === 'graded').length
  const pendingCount = (submissions ?? []).filter((s: any) => s.status === 'submitted').length

  const statusBadge: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-500',
    published: 'bg-blue-100 text-blue-700',
    closed: 'bg-emerald-100 text-emerald-700',
  }
  const statusLabel: Record<string, string> = {
    draft: 'Brouillon', published: 'Publié', closed: 'Clôturé',
  }

  const subStatusBadge: Record<string, string> = {
    submitted: 'bg-amber-100 text-amber-700',
    graded: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-blue-100 text-blue-700',
  }
  const subStatusLabel: Record<string, string> = {
    submitted: 'À corriger', graded: 'Corrigé', in_progress: 'En cours',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {sp.graded === '1' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 text-sm text-emerald-800">
          <span>✅</span><span>Note enregistrée avec succès.</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <a href="/teacher/assessments" className="text-sm text-blue-600 hover:underline">← Évaluations</a>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[assessment.status]}`}>
              {statusLabel[assessment.status]}
            </span>
          </div>
          {assessment.description && <p className="text-gray-500 text-sm mt-1">{assessment.description}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Questions', value: (questions ?? []).length },
          { label: 'Points total', value: totalPoints },
          { label: 'Soumissions', value: (submissions ?? []).length },
          { label: 'À corriger', value: pendingCount, warn: pendingCount > 0 },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl shadow-sm p-4 border ${s.warn ? 'border-amber-200' : 'border-gray-100'}`}>
            <p className={`text-2xl font-bold ${s.warn ? 'text-amber-600' : 'text-gray-900'}`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Assignments */}
      {(assignments ?? []).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Assignée à</h2>
          <div className="flex flex-wrap gap-2">
            {(assignments as any[]).map((a) => (
              <div key={a.id} className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                <span>{a.class?.name ?? a.class_id}</span>
                {a.due_at && <span className="text-xs text-blue-400">· Limite : {new Date(a.due_at).toLocaleDateString('fr-FR')}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions (teacher view) */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Questions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(questions ?? []).length > 0 ? (
              (questions as any[]).map((q, idx) => (
                <div key={q.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{q.prompt}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">
                          {q.question_type === 'mcq' ? 'Choix multiple' : 'Texte libre'}
                        </span>
                      </div>
                      {q.question_type === 'mcq' && Array.isArray(q.options) && (
                        <ul className="mt-2 space-y-1">
                          {(q.options as string[]).map((opt: string, oi: number) => (
                            <li key={oi} className={`text-xs px-2 py-1 rounded ${oi === q.correct_option_index ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500'}`}>
                              {oi === q.correct_option_index ? '✓ ' : ''}{opt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucune question</p>
            )}
          </div>
        </div>

        {/* Submissions */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Soumissions</h2>
            <span className="text-xs text-gray-400">{gradedCount}/{(submissions ?? []).length} corrigées</span>
          </div>
          <div className="divide-y divide-gray-50">
            {(submissions ?? []).length > 0 ? (
              (submissions as any[]).map((s) => (
                <div key={s.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.student?.full_name}</p>
                      <p className="text-xs text-gray-400">
                        {s.submitted_at
                          ? new Date(s.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.total_score !== null && s.total_score !== undefined && (
                        <span className="text-sm font-bold text-gray-700">{s.total_score}/{totalPoints}</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subStatusBadge[s.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {subStatusLabel[s.status] ?? s.status}
                      </span>
                    </div>
                  </div>

                  {/* Answers panel (client-side collapsible) */}
                  {s.answers && Object.keys(s.answers).length > 0 && (
                    <AnswersPanel
                      answers={s.answers}
                      questions={questions as any}
                    />
                  )}

                  {/* Grading form */}
                  {(s.status === 'submitted' || s.status === 'graded') && (
                    <form action={gradeSubmission} className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <input type="hidden" name="submission_id" value={s.id} />
                      <input type="hidden" name="assessment_id" value={id} />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          name="total_score"
                          defaultValue={s.total_score ?? ''}
                          min={0}
                          max={totalPoints}
                          step={0.5}
                          placeholder={`Note / ${totalPoints}`}
                          className="flex-1 border border-gray-400 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Enregistrer
                        </button>
                      </div>
                      <input
                        type="text"
                        name="teacher_feedback"
                        defaultValue={s.teacher_feedback ?? ''}
                        placeholder="Commentaire pour l'élève…"
                        className="w-full border border-gray-400 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </form>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucune soumission</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
