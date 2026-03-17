import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { redirect } from 'next/navigation'

async function updateStatus(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  await db.from('assessments').update({ status }).eq('id', id)
  redirect('/teacher/assessments')
}

async function deleteAssessment(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  await db.from('assessment_questions').delete().eq('assessment_id', id)
  await db.from('assessment_assignments').delete().eq('assessment_id', id)
  await db.from('assessment_submissions').delete().eq('assessment_id', id)
  await db.from('assessments').delete().eq('id', id)
  redirect('/teacher/assessments')
}

export default async function TeacherAssessments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const { data: assessments } = await db
    .from('assessments')
    .select('id, title, description, status, created_at, allow_attachments')
    .eq('teacher_id', user!.id)
    .order('created_at', { ascending: false })

  const assessmentIds = (assessments ?? []).map((a: any) => a.id)

  const [{ data: questions }, { data: submissions }, { data: assignments }] = await Promise.all([
    assessmentIds.length > 0
      ? db.from('assessment_questions').select('id, assessment_id').in('assessment_id', assessmentIds)
      : Promise.resolve({ data: [] }),
    assessmentIds.length > 0
      ? db.from('assessment_submissions').select('id, assessment_id, status').in('assessment_id', assessmentIds)
      : Promise.resolve({ data: [] }),
    assessmentIds.length > 0
      ? db.from('assessment_assignments').select('assessment_id, class_id, due_at, class:classes(name)').in('assessment_id', assessmentIds)
      : Promise.resolve({ data: [] }),
  ])

  const statusBadge: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-500',
    published: 'bg-blue-100 text-blue-700',
    closed: 'bg-emerald-100 text-emerald-700',
  }
  const statusLabel: Record<string, string> = {
    draft: 'Brouillon',
    published: 'Publié',
    closed: 'Clôturé',
  }

  const counts = { draft: 0, published: 0, closed: 0 }
  ;(assessments ?? []).forEach((a: any) => { if (a.status in counts) counts[a.status as keyof typeof counts]++ })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
          <p className="text-gray-500 text-sm mt-1">{(assessments ?? []).length} évaluation{(assessments ?? []).length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/teacher/assessments/add" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Nouvelle évaluation
        </Link>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([['draft', '✏️', 'Brouillons'], ['published', '📢', 'Publiées'], ['closed', '🔒', 'Clôturées']] as const).map(([s, icon, label]) => (
          <div key={s} className={`rounded-xl p-4 border text-center ${statusBadge[s]}`}>
            <p className="text-xl mb-1">{icon}</p>
            <p className="text-2xl font-bold">{counts[s]}</p>
            <p className="text-xs">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {(assessments ?? []).length > 0 ? (
          (assessments as any[]).map((a) => {
            const qCount = (questions ?? []).filter((q: any) => q.assessment_id === a.id).length
            const subs = (submissions ?? []).filter((s: any) => s.assessment_id === a.id)
            const pendingSubs = subs.filter((s: any) => s.status === 'submitted').length
            const asgns = (assignments ?? []).filter((x: any) => x.assessment_id === a.id)
            return (
              <div key={a.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[a.status]}`}>
                        {statusLabel[a.status] ?? a.status}
                      </span>
                      {pendingSubs > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {pendingSubs} à corriger
                        </span>
                      )}
                    </div>
                    {a.description && <p className="text-sm text-gray-500 mb-2 line-clamp-1">{a.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      <span>{qCount} question{qCount !== 1 ? 's' : ''}</span>
                      <span>{subs.length} soumission{subs.length !== 1 ? 's' : ''}</span>
                      {asgns.length > 0 && (
                        <span>Assignée à : {asgns.map((x: any) => x.class?.name).filter(Boolean).join(', ')}</span>
                      )}
                      <span>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link href={`/teacher/assessments/${a.id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center">
                      Voir détails
                    </Link>
                    {a.status === 'draft' && (
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="status" value="published" />
                        <button type="submit" className="w-full px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                          Publier
                        </button>
                      </form>
                    )}
                    {a.status === 'published' && (
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="status" value="closed" />
                        <button type="submit" className="w-full px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                          Clôturer
                        </button>
                      </form>
                    )}
                    <form action={deleteAssessment}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="w-full px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500">Aucune évaluation créée.</p>
            <Link href="/teacher/assessments/add" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
              Créer ma première évaluation
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
