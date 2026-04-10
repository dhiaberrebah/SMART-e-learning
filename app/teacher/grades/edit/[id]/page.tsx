import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getTeacherClasses } from '@/lib/teacher-classes'

async function updateGrade(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const id = formData.get('id') as string
  const studentId = formData.get('student_id') as string
  const subjectId = formData.get('subject_id') as string
  const gradeValue = parseFloat(formData.get('grade_value') as string)
  const maxGrade = parseFloat(formData.get('max_grade') as string) || 20
  const gradeType = formData.get('grade_type') as string
  const date = formData.get('date') as string
  const notes = formData.get('notes') as string

  if (!id || !studentId || !subjectId || isNaN(gradeValue)) {
    redirect(`/teacher/grades/edit/${id}?error=missing`)
  }

  const { data: subOk } = await db
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .eq('teacher_id', user.id)
    .maybeSingle()
  if (!subOk) {
    redirect(`/teacher/grades/edit/${id}?error=` + encodeURIComponent('Matière non autorisée.'))
  }

  const { data: existing } = await db.from('grades').select('id').eq('id', id).maybeSingle()
  if (!existing) {
    redirect('/teacher/grades?error=' + encodeURIComponent('Note introuvable.'))
  }

  const { error } = await db
    .from('grades')
    .update({
      student_id: studentId,
      subject_id: subjectId,
      grade_value: gradeValue,
      max_grade: maxGrade,
      grade_type: gradeType || 'exam',
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || null,
    })
    .eq('id', id)

  if (error) {
    redirect(`/teacher/grades/edit/${id}?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/teacher/grades?updated=1')
}

export default async function EditGradePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const db = createServiceClient()

  const { data: grade } = await db
    .from('grades')
    .select('id, student_id, subject_id, grade_value, max_grade, grade_type, date, notes')
    .eq('id', id)
    .maybeSingle()

  if (!grade) notFound()

  const { data: sub } = await db
    .from('subjects')
    .select('teacher_id')
    .eq('id', grade.subject_id)
    .maybeSingle()

  if (!sub || sub.teacher_id !== user.id) notFound()

  const classes = await getTeacherClasses(db, user.id, 'id, name')
  const classIds = (classes ?? []).map((c: any) => c.id)

  const [{ data: students }, { data: subjects }] = await Promise.all([
    classIds.length > 0
      ? db.from('students').select('id, full_name, class_id').in('class_id', classIds).order('full_name')
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? db
          .from('subjects')
          .select('id, name, class_id')
          .in('class_id', classIds)
          .eq('teacher_id', user.id)
          .order('name')
      : Promise.resolve({ data: [] }),
  ])

  const { data: stu } = await db.from('students').select('class_id').eq('id', grade.student_id).maybeSingle()
  const classIdForStudent = stu?.class_id ?? ''

  const dateStr =
    typeof grade.date === 'string'
      ? grade.date.split('T')[0]
      : new Date(grade.date as string).toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/teacher/grades" className="text-sm text-blue-600 hover:underline">
          ← Notes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Modifier la note</h1>
      </div>

      {sp.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ❌ {sp.error === 'missing' ? 'Veuillez remplir tous les champs obligatoires.' : sp.error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form action={updateGrade} className="space-y-5">
          <input type="hidden" name="id" value={grade.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Classe <span className="text-red-500">*</span>
            </label>
            <select
              name="class_id"
              required
              defaultValue={classIdForStudent}
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une classe</option>
              {(classes as any[] ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Changer la classe puis l&apos;élève si besoin (même établissement).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Élève <span className="text-red-500">*</span>
            </label>
            <select
              name="student_id"
              required
              defaultValue={grade.student_id}
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un élève</option>
              {(students as any[] ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Matière <span className="text-red-500">*</span>
            </label>
            <select
              name="subject_id"
              required
              defaultValue={grade.subject_id}
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une matière</option>
              {(subjects as any[] ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Note obtenue <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="grade_value"
                required
                min="0"
                step="0.5"
                defaultValue={grade.grade_value}
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note maximale</label>
              <input
                type="number"
                name="max_grade"
                min="1"
                step="0.5"
                defaultValue={grade.max_grade ?? 20}
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type d&apos;évaluation</label>
              <select
                name="grade_type"
                defaultValue={grade.grade_type ?? 'exam'}
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="exam">Examen</option>
                <option value="quiz">Quiz</option>
                <option value="homework">Devoir maison</option>
                <option value="project">Projet</option>
                <option value="participation">Participation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                name="date"
                defaultValue={dateStr}
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observations</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={grade.notes ?? ''}
              placeholder="Remarques, commentaires…"
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Enregistrer les modifications
            </button>
            <Link
              href="/teacher/grades"
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
