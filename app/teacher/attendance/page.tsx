import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'

async function saveAttendance(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const classId = formData.get('class_id') as string
  const date = formData.get('date') as string

  // Verify teacher owns this class
  const { data: cls } = await db.from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).single()
  if (!cls) return

  // Get students in class
  const { data: students } = await db.from('students').select('id').eq('class_id', classId)

  // Delete existing attendance for this class+date
  await db.from('attendance').delete().eq('class_id', classId).eq('date', date)

  // Insert new records
  const records = (students ?? []).map((s: any) => ({
    student_id: s.id,
    class_id: classId,
    date,
    status: (formData.get(`status_${s.id}`) as string) || 'absent',
    notes: (formData.get(`notes_${s.id}`) as string) || null,
  }))

  if (records.length > 0) {
    await db.from('attendance').insert(records)
  }

  redirect(`/teacher/attendance?class_id=${classId}&date=${date}&saved=1`)
}

export default async function TeacherAttendance({ searchParams }: { searchParams: Promise<{ class_id?: string; date?: string; saved?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const today = new Date().toISOString().split('T')[0]
  const selectedDate = sp.date ?? today
  const selectedClass = sp.class_id ?? ''

  const { data: classes } = await db
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user!.id)
    .order('name')

  let students: any[] = []
  let existingAttendance: any[] = []

  if (selectedClass) {
    const [{ data: s }, { data: a }] = await Promise.all([
      db.from('students').select('id, full_name, student_number').eq('class_id', selectedClass).order('full_name'),
      db.from('attendance').select('student_id, status, notes').eq('class_id', selectedClass).eq('date', selectedDate),
    ])
    students = s ?? []
    existingAttendance = a ?? []
  }

  const getStatus = (studentId: string) =>
    existingAttendance.find((a: any) => a.student_id === studentId)?.status ?? 'present'
  const getNotes = (studentId: string) =>
    existingAttendance.find((a: any) => a.student_id === studentId)?.notes ?? ''

  const presentCount = existingAttendance.filter((a: any) => a.status === 'present').length
  const absentCount = existingAttendance.filter((a: any) => a.status === 'absent').length
  const lateCount = existingAttendance.filter((a: any) => a.status === 'late').length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des présences</h1>
        <p className="text-gray-500 text-sm mt-1">Marquez les présences pour vos classes</p>
      </div>

      {sp.saved && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          ✅ Présences enregistrées avec succès.
        </div>
      )}

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Classe</label>
          <select name="class_id" defaultValue={selectedClass}
            className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[200px]">
            <option value="">Sélectionner une classe</option>
            {(classes as any[] ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" name="date" defaultValue={selectedDate}
            className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Charger
          </button>
        </div>
      </form>

      {selectedClass && students.length > 0 && (
        <>
          {/* Stats */}
          {existingAttendance.length > 0 && (
            <div className="flex gap-4 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-sm">
                <span className="font-bold text-emerald-700">{presentCount}</span> <span className="text-emerald-600">présents</span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
                <span className="font-bold text-red-700">{absentCount}</span> <span className="text-red-600">absents</span>
              </div>
              {lateCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm">
                  <span className="font-bold text-amber-700">{lateCount}</span> <span className="text-amber-600">en retard</span>
                </div>
              )}
            </div>
          )}

          <form action={saveAttendance}>
            <input type="hidden" name="class_id" value={selectedClass} />
            <input type="hidden" name="date" value={selectedDate} />

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
              <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {(classes as any[]).find((c: any) => c.id === selectedClass)?.name} —{' '}
                  {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                <span className="text-sm text-gray-500">{students.length} élèves</span>
              </div>

              <div className="divide-y divide-gray-50">
                {students.map((student: any, idx: number) => {
                  const current = getStatus(student.id)
                  return (
                    <div key={student.id} className={`flex items-center gap-4 px-5 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <span className="w-6 text-gray-400 text-sm text-right">{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 text-xs font-bold">{student.full_name?.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{student.full_name}</p>
                        <p className="text-xs text-gray-400">{student.student_number}</p>
                      </div>
                      <div className="flex gap-2">
                        {(['present', 'absent', 'late', 'excused'] as const).map((s) => {
                          const labels = { present: 'Présent', absent: 'Absent', late: 'En retard', excused: 'Excusé' }
                          const colors = {
                            present: 'border-emerald-500 bg-emerald-500 text-white',
                            absent: 'border-red-500 bg-red-500 text-white',
                            late: 'border-amber-500 bg-amber-500 text-white',
                            excused: 'border-blue-500 bg-blue-500 text-white',
                          }
                          const inactiveColors = {
                            present: 'border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600',
                            absent: 'border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-600',
                            late: 'border-gray-200 text-gray-400 hover:border-amber-400 hover:text-amber-600',
                            excused: 'border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600',
                          }
                          return (
                            <label key={s} className={`cursor-pointer border rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${current === s ? colors[s] : inactiveColors[s]}`}>
                              <input type="radio" name={`status_${student.id}`} value={s} defaultChecked={current === s} className="sr-only" />
                              {labels[s]}
                            </label>
                          )
                        })}
                      </div>
                      <input type="text" name={`notes_${student.id}`} defaultValue={getNotes(student.id)} placeholder="Note…"
                        className="border border-gray-400 rounded-lg px-3 py-1.5 text-xs text-gray-600 w-28 focus:ring-1 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                Enregistrer les présences
              </button>
            </div>
          </form>
        </>
      )}

      {selectedClass && students.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <p className="text-gray-400">Aucun élève dans cette classe.</p>
        </div>
      )}

      {!selectedClass && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-500">Sélectionnez une classe pour saisir les présences.</p>
        </div>
      )}
    </div>
  )
}
