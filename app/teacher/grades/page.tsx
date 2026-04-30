import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTeacherClasses } from '@/lib/teacher-classes'

async function deleteGrade(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  await db.from('grades').delete().eq('id', id)
  redirect('/teacher/grades')
}

const GRADE_TYPES = ['exam', 'quiz', 'homework', 'project', 'participation'] as const

async function bulkGrades(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const classId = String(formData.get('bulk_class_id') ?? '').trim()
  const subjectId = String(formData.get('bulk_subject_id') ?? '').trim()
  const maxGrade = parseFloat(String(formData.get('bulk_max_grade') ?? '')) || 20
  const gradeTypeRaw = String(formData.get('bulk_grade_type') ?? 'exam').trim()
  const dateRaw = String(formData.get('bulk_date') ?? '').trim()
  const gradeType = GRADE_TYPES.includes(gradeTypeRaw as (typeof GRADE_TYPES)[number])
    ? gradeTypeRaw
    : 'exam'
  const date = dateRaw || new Date().toISOString().split('T')[0]

  const back = (q: string) => redirect(`/teacher/grades?${q}`)

  if (!classId || !subjectId) {
    back('error_bulk=' + encodeURIComponent('Classe ou matière manquante.'))
  }

  const { data: sub } = await db
    .from('subjects')
    .select('id, class_id')
    .eq('id', subjectId)
    .eq('teacher_id', user.id)
    .maybeSingle()

  if (!sub || sub.class_id !== classId) {
    back(
      `class_id=${encodeURIComponent(classId)}&error_bulk=` +
        encodeURIComponent('Matière non autorisée pour cette classe.')
    )
  }

  const { data: classStudents } = await db.from('students').select('id').eq('class_id', classId)
  const inClass = new Set((classStudents ?? []).map((s: { id: string }) => s.id))

  const prefix = 'grade_student_'
  const inserts: {
    student_id: string
    subject_id: string
    grade_value: number
    max_grade: number
    grade_type: string
    date: string
    notes: string | null
  }[] = []

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(prefix)) continue
    const studentId = key.slice(prefix.length).trim()
    const raw = String(value ?? '').trim().replace(',', '.')
    if (!raw) continue
    if (!inClass.has(studentId)) continue
    const gradeValue = parseFloat(raw)
    if (Number.isNaN(gradeValue) || gradeValue < 0) continue
    if (gradeValue > maxGrade) {
      back(
        `class_id=${encodeURIComponent(classId)}&subject_id=${encodeURIComponent(subjectId)}&error_bulk=` +
          encodeURIComponent(`La note ne peut pas dépasser ${maxGrade}.`)
      )
    }

    const notesRaw = String(formData.get(`notes_student_${studentId}`) ?? '').trim()
    inserts.push({
      student_id: studentId,
      subject_id: subjectId,
      grade_value: gradeValue,
      max_grade: maxGrade,
      grade_type: gradeType,
      date,
      notes: notesRaw || null,
    })
  }

  if (inserts.length === 0) {
    back(
      `class_id=${encodeURIComponent(classId)}&subject_id=${encodeURIComponent(subjectId)}&error_bulk=` +
        encodeURIComponent('Saisissez au moins une note.')
    )
  }

  const { error } = await db.from('grades').insert(inserts)
  if (error) {
    back(
      `class_id=${encodeURIComponent(classId)}&subject_id=${encodeURIComponent(subjectId)}&error_bulk=` +
        encodeURIComponent(error.message)
    )
  }

  redirect(
    `/teacher/grades?class_id=${encodeURIComponent(classId)}&subject_id=${encodeURIComponent(subjectId)}&saved_bulk=1`
  )
}

export default async function TeacherGrades({
  searchParams,
}: {
  searchParams: Promise<{
    class_id?: string
    subject_id?: string
    student_id?: string
    saved_bulk?: string
    error_bulk?: string
  }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const classes = await getTeacherClasses(db, user!.id, 'id, name')
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

  const selectedClassName =
    sp.class_id ? ((classes ?? []).find((c: any) => c.id === sp.class_id)?.name as string | undefined) : undefined

  const today = new Date().toISOString().split('T')[0]
  const defaultBulkSubject =
    sp.subject_id && (filteredSubjects as any[]).some((s: any) => s.id === sp.subject_id)
      ? sp.subject_id
      : ((filteredSubjects as any[])[0]?.id as string | undefined) ?? ''

  return (
    <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
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

      {sp.saved_bulk === '1' && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Les notes ont été enregistrées pour les élèves concernés.
        </div>
      )}
      {sp.error_bulk && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sp.error_bulk}
        </div>
      )}

      {sp.class_id && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/60">
            <h2 className="text-base font-semibold text-gray-900">
              Noter la classe {selectedClassName ? `· ${selectedClassName}` : ''}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Liste des élèves : saisissez une note pour chacun (champ vide = ignoré). Une matière est requise.
            </p>
          </div>

          {(filteredSubjects as any[]).length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Aucune matière pour cette classe avec vous comme enseignant. Ajoutez une matière depuis{' '}
              <Link href="/teacher/subjects" className="text-blue-600 font-medium hover:underline">
                Mes matières
              </Link>
              .
            </div>
          ) : (filteredStudents as any[]).length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">Aucun élève dans cette classe.</div>
          ) : (
            <form action={bulkGrades} className="p-5 space-y-4">
              <input type="hidden" name="bulk_class_id" value={sp.class_id} />
              <div className="flex flex-wrap gap-4 items-end">
                <div className="min-w-[200px]">
                  <label htmlFor="bulk_subject_id" className="block text-xs font-medium text-gray-600 mb-1">
                    Matière <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="bulk_subject_id"
                    name="bulk_subject_id"
                    required
                    defaultValue={defaultBulkSubject}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {(filteredSubjects as any[]).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="bulk_max_grade" className="block text-xs font-medium text-gray-600 mb-1">
                    Note max
                  </label>
                  <input
                    id="bulk_max_grade"
                    name="bulk_max_grade"
                    type="number"
                    min="1"
                    step="0.5"
                    defaultValue={20}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="bulk_grade_type" className="block text-xs font-medium text-gray-600 mb-1">
                    Type
                  </label>
                  <select
                    id="bulk_grade_type"
                    name="bulk_grade_type"
                    defaultValue="exam"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="exam">Examen</option>
                    <option value="quiz">Quiz</option>
                    <option value="homework">Devoir maison</option>
                    <option value="project">Projet</option>
                    <option value="participation">Participation</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bulk_date" className="block text-xs font-medium text-gray-600 mb-1">
                    Date
                  </label>
                  <input
                    id="bulk_date"
                    name="bulk_date"
                    type="date"
                    defaultValue={today}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Élève</th>
                      <th className="px-4 py-2 text-left w-28">Note</th>
                      <th className="px-4 py-2 text-left">Observation (optionnel)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(filteredStudents as any[]).map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-2 font-medium text-gray-900">{s.full_name}</td>
                        <td className="px-4 py-2">
                          <input
                            name={`grade_student_${s.id}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="—"
                            className="w-full min-w-[4.5rem] border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                            autoComplete="off"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            name={`notes_student_${s.id}`}
                            type="text"
                            placeholder="…"
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                            autoComplete="off"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Enregistrer les notes
                </button>
                <p className="text-xs text-gray-500 self-center">Seules les lignes avec une note sont enregistrées.</p>
              </div>
            </form>
          )}
        </div>
      )}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Historique des notes</h2>
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
                <th className="px-4 py-3 text-center">Modifier</th>
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
                        <div className="flex flex-col items-center gap-1">
                          <Link
                            href={`/teacher/grades/edit/${g.id}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Modifier
                          </Link>
                          <form action={deleteGrade} className="inline">
                            <input type="hidden" name="id" value={g.id} />
                            <button type="submit" className="text-xs text-red-500 hover:text-red-700 hover:underline">
                              Supprimer
                            </button>
                          </form>
                        </div>
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
