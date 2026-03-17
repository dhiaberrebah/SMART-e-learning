import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import SubmitForm from './SubmitForm'

async function submitAnswers(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const assessmentId = formData.get('assessment_id') as string
  const studentId = formData.get('student_id') as string

  const { data: existing } = await db
    .from('assessment_submissions')
    .select('id, status')
    .eq('assessment_id', assessmentId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existing?.status === 'graded') {
    redirect(`/parent/assessments/${assessmentId}?child_id=${studentId}&error=already_graded`)
  }

  const answers: Record<string, any> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('answer_')) {
      const questionId = key.replace('answer_', '')
      const numVal = Number(value)
      answers[questionId] = isNaN(numVal) ? value : numVal
    }
  }

  if (existing) {
    await db.from('assessment_submissions').update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      answers,
    }).eq('id', existing.id)
  } else {
    await db.from('assessment_submissions').insert({
      assessment_id: assessmentId,
      student_id: studentId,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      answers,
    })
  }

  redirect(`/parent/assessments/${assessmentId}?child_id=${studentId}&submitted=1`)
}

export default async function ParentAssessmentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ child_id?: string; submitted?: string; error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const [{ data: assessment }, { data: questions }] = await Promise.all([
    db.from('assessments')
      .select('id, title, description, status, created_at, allow_attachments, teacher:profiles!teacher_id(full_name)')
      .eq('id', id)
      .single(),
    db.from('assessment_questions')
      .select('id, position, question_type, prompt, options, correct_option_index, points')
      .eq('assessment_id', id)
      .order('position'),
  ])

  if (!assessment) notFound()
  if (!['published', 'closed'].includes(assessment.status)) notFound()

  const childId = sp.child_id ?? ''
  let child: any = null
  let submission: any = null

  if (childId) {
    const { data: c } = await db
      .from('students')
      .select('id, full_name, class_id, class:classes(name)')
      .eq('id', childId)
      .maybeSingle()
    child = c

    const { data: sub } = await db
      .from('assessment_submissions')
      .select('id, status, total_score, teacher_feedback, submitted_at, answers')
      .eq('assessment_id', id)
      .eq('student_id', childId)
      .maybeSingle()
    submission = sub
  }

  const totalPoints = (questions ?? []).reduce((sum: number, q: any) => sum + Number(q.points), 0)

  const statusBadge: Record<string, string> = {
    published: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-500',
  }
  const statusLabel: Record<string, string> = {
    published: 'En cours',
    closed: 'Clôturée',
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-1 text-sm">
        <Link href={`/parent/assessments${childId ? `?child_id=${childId}` : ''}`} className="text-emerald-600 hover:underline">
          ← Évaluations
        </Link>
      </div>

      {/* Alerts */}
      {sp.submitted === '1' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 text-sm text-emerald-800">
          <span className="text-lg">✅</span>
          <span>Réponses soumises avec succès. L'enseignant corrigera bientôt.</span>
        </div>
      )}
      {sp.error === 'already_graded' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-800">
          <span className="text-lg">⛔</span>
          <span>Cette évaluation a déjà été corrigée. Vous ne pouvez plus modifier vos réponses.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 mt-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[assessment.status]}`}>
              {statusLabel[assessment.status]}
            </span>
          </div>
          {(assessment as any).teacher?.full_name && (
            <p className="text-gray-500 text-sm mt-1">Par {(assessment as any).teacher.full_name}</p>
          )}
          {assessment.description && (
            <p className="text-gray-600 text-sm mt-2 bg-gray-50 rounded-lg px-3 py-2">{assessment.description}</p>
          )}
        </div>
      </div>

      {/* Child result banner */}
      {child && (
        <div className={`rounded-xl p-4 mb-6 border ${submission?.status === 'graded' ? 'bg-emerald-50 border-emerald-200' : submission?.status === 'submitted' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-emerald-300 flex items-center justify-center">
                <span className="text-emerald-700 text-xs font-bold">{child.full_name?.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{child.full_name}</p>
                <p className="text-xs text-gray-500">{child.class?.name}</p>
              </div>
            </div>
            {submission ? (
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {submission.status === 'graded' ? '✅ Corrigé' : submission.status === 'submitted' ? '⏳ En attente de correction' : '📝 En cours'}
                </p>
                {submission.status === 'graded' && submission.total_score !== null && (
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">{submission.total_score} / {totalPoints} pts</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Pas encore soumis</p>
            )}
          </div>
          {submission?.teacher_feedback && (
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <p className="text-xs text-gray-500 font-medium mb-1">Commentaire de l'enseignant :</p>
              <p className="text-sm text-gray-700 italic">"{submission.teacher_feedback}"</p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="bg-white rounded-xl shadow-sm px-4 py-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-gray-900">{(questions ?? []).length}</p>
          <p className="text-xs text-gray-400">Questions</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm px-4 py-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-gray-900">{totalPoints}</p>
          <p className="text-xs text-gray-400">Points total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm px-4 py-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-gray-900">
            {new Date(assessment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
          <p className="text-xs text-gray-400">Publié le</p>
        </div>
      </div>

      {/* Submission form (child must be selected) */}
      {child ? (
        <SubmitForm
          assessmentId={id}
          studentId={childId}
          questions={questions as any}
          submission={submission}
          totalPoints={totalPoints}
          onSubmit={submitAnswers}
        />
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
          Sélectionnez un enfant depuis la liste des évaluations pour voir et soumettre les réponses.
        </div>
      )}
    </div>
  )
}
