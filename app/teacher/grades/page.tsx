import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { redirect } from 'next/navigation'

async function deleteGrade(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  await db.from('grades').delete().eq('id', id)
  redirect('/teacher/grades')
}

export default async function TeacherGrades({ searchParams }: { searchParams: Promise<{ class_id?: string; subject_id?: string; student_id?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const { data: classes } = await db.from('classes').select('id, name').eq('teacher_id', user!.id).order('name')
  const classIds = (classes ?? []).map((c: any) => c.id)

  const [{ data: subjects }, { data: students }] = await Promise.all([
    classIds.length > 0
      ? db
          .from('subjects')
          .select('id, name, class_id')
          .in('class_id', classIds)
          .eq('teacher_id', user!.id)
          .order('name')
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? db.from('students').select('id, full_name, class_id').in('class_id', classIds).order('full_name')
      : Promise.resolve({ data: [] }),
  ])

  // Determine which student IDs to query
  const targetStudentIds = sp.student_id
    ? [sp.student_id]
    : sp.class_id
      ? (students ?? []).filter((s: any) => s.class_id === sp.class_id).map((s: any) => s.id)
      : (students ?? []).map((s: any) => s.id)

  let gradesData: any[] = []
  if (targetStudentIds.length > 0) {
    let query = db
      .from('grades')
      .select('id, grade_value, max_grade, grade_type, date, notes, student:students(id, full_name, class_id), subject:subjects(id, name)')
      .in('student_id', targetStudentIds)
    if (sp.subject_id) query = query.eq('subject_id', sp.subject_id)
    const { data } = await query.order('date', { ascending: false })
    gradesData = data ?? []
  }

  // Attach class name from students data
  const grades = gradesData.map((g: any) => ({
    ...g,
    class: (classes ?? []).find((c: any) => c.id === g.student?.class_id) ?? null,
  }))

  const filteredSubjects = sp.class_id ? (subjects ?? []).filter((s: any) => s.class_id === sp.class_id) : (subjects ?? [])
  const filteredStudents = sp.class_id ? (students ?? []).filter((s: any) => s.class_id === sp.class_id) : (students ?? [])

  const avg = (grades ?? []).length > 0
    ? ((grades as any[]).reduce((sum, g) => sum + (g.grade_value / g.max_grade) * 20, 0) / (grades as any[]).length).toFixed(2)
    : null

  const gradeTypeLabel: Record<string, string> = {
    homework: 'Devoir maison',
    quiz: 'Quiz',
    exam: 'Examen',
    project: 'Projet',
    participation: 'Participation',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-500 text-sm mt-1">{(grades ?? []).length} note{(grades ?? []).length !== 1 ? 's' : ''}{avg ? ` · Moy. ${avg}/20` : ''}</p>
        </div>
        <Link href="/teacher/grades/add" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Ajouter une note
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6 bg-white rounded-xl shadow-sm p-4">
        <select name="class_id" defaultValue={sp.class_id ?? ''}
          className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes les classes</option>
          {(classes as any[] ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="subject_id" defaultValue={sp.subject_id ?? ''}
          className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes les matières</option>
          {(filteredSubjects as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select name="student_id" defaultValue={sp.student_id ?? ''}
          className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les élèves</option>
          {(filteredStudents as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Filtrer
        </button>
        {(sp.class_id || sp.subject_id || sp.student_id) && (
          <Link href="/teacher/grades" className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Réinitialiser
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Élève</th>
                <th className="px-5 py-3 text-left">Matière</th>
                <th className="px-5 py-3 text-left">Classe</th>
                <th className="px-4 py-3 text-center">Note</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Observations</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(grades ?? []).length > 0 ? (
                (grades as any[]).map((g) => {
                  const normalized = (g.grade_value / g.max_grade) * 20
                  return (
                    <tr key={g.id} className="hover:bg-gray-50 text-sm">
                      <td className="px-5 py-3 font-medium text-gray-900">{g.student?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{g.subject?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-500">{g.class?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${normalized >= 14 ? 'bg-emerald-100 text-emerald-700' : normalized >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {g.grade_value}/{g.max_grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {gradeTypeLabel[g.grade_type] ?? g.grade_type ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{new Date(g.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">{g.notes ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <form action={deleteGrade} className="inline">
                          <input type="hidden" name="id" value={g.id} />
                          <button type="submit" className="text-xs text-red-500 hover:text-red-700 hover:underline">
                            Supprimer
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan={8} className="text-center text-gray-400 py-10">Aucune note trouvée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
