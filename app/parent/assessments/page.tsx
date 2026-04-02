import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

export default async function ParentAssessments({ searchParams }: { searchParams: Promise<{ child_id?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  // Get parent's children
  const { data: children } = await db
    .from('students')
    .select('id, full_name, class_id, class:classes(id, name)')
    .eq('parent_id', user!.id)
    .order('full_name')

  const selectedChild = sp.child_id ?? (children?.[0]?.id ?? '')
  const child = (children ?? []).find((c: any) => c.id === selectedChild)

  let assessments: any[] = []
  let submissions: any[] = []

  // Always fetch all published/closed assessments
  const { data: allAssessments, error: assessmentsError } = await db
    .from('assessments')
    .select('id, title, description, status, created_at, teacher:profiles!teacher_id(full_name)')
    .in('status', ['published', 'closed'])
    .order('created_at', { ascending: false })

  if (assessmentsError) console.error('[parent/assessments] query error:', assessmentsError)
  assessments = allAssessments ?? []

  // Enrich with due_at from assignments if child has a class
  if (child?.class_id && assessments.length > 0) {
    const { data: assignments } = await db
      .from('assessment_assignments')
      .select('assessment_id, due_at')
      .eq('class_id', child.class_id)
    const dueMap: Record<string, string | null> = {}
    for (const a of assignments ?? []) dueMap[a.assessment_id] = a.due_at
    assessments = assessments.map((a: any) => ({ ...a, due_at: dueMap[a.id] ?? null }))
  }

  // Get submissions for selected child
  if (selectedChild && assessments.length > 0) {
    const assessmentIds = assessments.map((a: any) => a.id)
    const { data: subs } = await db
      .from('assessment_submissions')
      .select('id, assessment_id, status, total_score, teacher_feedback, submitted_at')
      .eq('student_id', selectedChild)
      .in('assessment_id', assessmentIds)
    submissions = subs ?? []
  }

  const getSubmission = (assessmentId: string) =>
    submissions.find((s: any) => s.assessment_id === assessmentId)

  const statusBadge: Record<string, string> = {
    published: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-500',
  }
  const statusLabel: Record<string, string> = {
    published: 'En cours',
    closed: 'Clôturée',
  }
  const subStatusBadge: Record<string, string> = {
    submitted: 'bg-amber-100 text-amber-700',
    graded: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-blue-100 text-blue-700',
  }
  const subStatusLabel: Record<string, string> = {
    submitted: 'Rendu',
    graded: 'Corrigé',
    in_progress: 'En cours',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
        <p className="text-gray-500 text-sm mt-1">Évaluations publiées par les enseignants</p>
      </div>

      {/* Child selector */}
      {(children ?? []).length > 1 && (
        <form method="GET" className="mb-6">
          <div className="flex gap-3">
            <select name="child_id" defaultValue={selectedChild}
              className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
              {(children as any[]).map((c: any) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
              Afficher
            </button>
          </div>
        </form>
      )}

      {/* Child info banner */}
      {child && selectedChild && (
        <div className="flex items-center gap-3 mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-800 text-xs font-bold">{(child as any).full_name?.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900">{(child as any).full_name}</p>
            <p className="text-xs text-emerald-600">{(child as any).class?.name ?? 'Aucune classe assignée'}</p>
          </div>
          <span className="ml-auto text-xs text-emerald-600 font-medium">{assessments.length} évaluation{assessments.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Warn if no children — but still show assessments */}
      {(children ?? []).length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <span>
            Aucun enfant lié : vérifiez votre CIN dans Mon profil (même numéro que pour l&apos;école).
            Les évaluations sont visibles mais vous ne pourrez pas soumettre de réponses.
          </span>
        </div>
      )}

      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-500">Aucune évaluation publiée pour le moment.</p>
          <p className="text-gray-400 text-sm mt-1">Les évaluations publiées par les enseignants apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((a: any) => {
            const sub = getSubmission(a.id)
            const isOverdue = a.due_at && new Date(a.due_at) < new Date() && a.status === 'published'
            return (
              <div key={a.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:border-indigo-200 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[a.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {statusLabel[a.status] ?? a.status}
                      </span>
                      {sub && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subStatusBadge[sub.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {subStatusLabel[sub.status] ?? sub.status}
                        </span>
                      )}
                      {!sub && (children ?? []).length > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Non soumis
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          Délai dépassé
                        </span>
                      )}
                    </div>

                    {a.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{a.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      {a.teacher?.full_name && <span>Enseignant : {a.teacher.full_name}</span>}
                      {a.due_at && (
                        <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                          Limite : {new Date(a.due_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                      <span>Publié le {new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>

                    {/* Score if graded */}
                    {sub?.status === 'graded' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4">
                        {sub.total_score !== null && sub.total_score !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Note :</span>
                            <span className="text-sm font-bold text-emerald-600">{sub.total_score} pts</span>
                          </div>
                        )}
                        {sub.teacher_feedback && (
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-xs text-gray-500 flex-shrink-0">Commentaire :</span>
                            <span className="text-xs text-gray-600 italic">{sub.teacher_feedback}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/parent/assessments/${a.id}${selectedChild ? `?child_id=${selectedChild}` : ''}`}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    {sub ? 'Voir réponses' : 'Répondre'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
