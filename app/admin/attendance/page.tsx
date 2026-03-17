import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function saveAttendance(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const classId = formData.get('class_id') as string
  const date = formData.get('date') as string

  // Get all student IDs from form
  const entries = Array.from(formData.entries())
  const statusEntries = entries.filter(([key]) => key.startsWith('status_'))

  if (statusEntries.length === 0) return

  // Delete existing records for this class+date
  await supabase
    .from('attendance')
    .delete()
    .eq('class_id', classId)
    .eq('date', date)

  // Insert new records
  const records = statusEntries.map(([key, value]) => ({
    student_id: key.replace('status_', ''),
    class_id: classId,
    date,
    status: value as string,
  }))

  await supabase.from('attendance').insert(records)

  const { redirect } = await import('next/navigation')
  redirect(`/admin/attendance?class_id=${classId}&date=${date}&success=saved`)
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; date?: string; success?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const selectedDate = sp.date || today
  const selectedClassId = sp.class_id || ''

  // Load all classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade_level')
    .order('name')

  // Load students for selected class
  let students: any[] = []
  if (selectedClassId) {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, student_number')
      .eq('class_id', selectedClassId)
      .order('full_name')
    students = data || []
  }

  // Load existing attendance for selected class + date
  let existingAttendance: Record<string, string> = {}
  if (selectedClassId && selectedDate) {
    const { data } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', selectedClassId)
      .eq('date', selectedDate)
    existingAttendance = Object.fromEntries(
      (data || []).map(a => [a.student_id, a.status])
    )
  }

  // Recent attendance records (last 10 sessions) for overview
  const { data: recentSessions } = await supabase
    .from('attendance')
    .select('date, class_id, status, class:classes(name)')
    .order('date', { ascending: false })
    .limit(50)

  // Group by date+class
  const sessionMap = new Map<string, { date: string; className: string; classId: string; total: number; present: number }>()
  recentSessions?.forEach((r: any) => {
    const key = `${r.date}_${r.class_id}`
    if (!sessionMap.has(key)) {
      sessionMap.set(key, { date: r.date, className: r.class?.name || '?', classId: r.class_id, total: 0, present: 0 })
    }
    const s = sessionMap.get(key)!
    s.total++
    if (r.status === 'present') s.present++
  })
  const recentGroups = Array.from(sessionMap.values()).slice(0, 10)

  const statusOptions = [
    { value: 'present', label: 'Présent', color: 'text-emerald-700' },
    { value: 'absent', label: 'Absent', color: 'text-red-600' },
    { value: 'late', label: 'En retard', color: 'text-amber-600' },
    { value: 'excused', label: 'Excusé', color: 'text-blue-600' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des présences</h1>
        <p className="text-gray-500 mt-1">Enregistrer et consulter les présences des élèves</p>
      </div>

      {sp.success === 'saved' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Présences enregistrées avec succès
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 mb-3">Saisir les présences</h2>
              {/* Filters */}
              <form method="GET" className="flex gap-3 flex-wrap">
                <select
                  name="class_id"
                  defaultValue={selectedClassId}
                  className="px-3 py-2 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choisir une classe</option>
                  {classes?.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.grade_level ? ` (${c.grade_level})` : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="px-3 py-2 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Charger
                </button>
              </form>
            </div>

            {selectedClassId && students.length > 0 ? (
              <form action={saveAttendance}>
                <input type="hidden" name="class_id" value={selectedClassId} />
                <input type="hidden" name="date" value={selectedDate} />

                <div className="divide-y divide-gray-50">
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-700 text-xs font-bold">{s.full_name?.charAt(0)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                        {s.student_number && <p className="text-xs text-gray-400">N° {s.student_number}</p>}
                      </div>
                      <div className="flex gap-2">
                        {statusOptions.map(opt => (
                          <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`status_${s.id}`}
                              value={opt.value}
                              defaultChecked={
                                existingAttendance[s.id]
                                  ? existingAttendance[s.id] === opt.value
                                  : opt.value === 'present'
                              }
                              className="sr-only peer"
                            />
                            <span className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer peer-checked:ring-2 peer-checked:ring-offset-1 ${
                              opt.value === 'present' ? 'border-emerald-200 text-emerald-700 peer-checked:bg-emerald-100 peer-checked:ring-emerald-400' :
                              opt.value === 'absent' ? 'border-red-200 text-red-600 peer-checked:bg-red-100 peer-checked:ring-red-400' :
                              opt.value === 'late' ? 'border-amber-200 text-amber-600 peer-checked:bg-amber-100 peer-checked:ring-amber-400' :
                              'border-blue-200 text-blue-600 peer-checked:bg-blue-100 peer-checked:ring-blue-400'
                            }`}>
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 border-t bg-gray-50">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                  >
                    Enregistrer les présences du {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR')}
                  </button>
                </div>
              </form>
            ) : selectedClassId && students.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Aucun élève dans cette classe
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">
                Sélectionnez une classe et une date pour saisir les présences
              </div>
            )}
          </div>
        </div>

        {/* Recent sessions sidebar */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Sessions récentes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentGroups.length > 0 ? (
              recentGroups.map((g, i) => {
                const rate = g.total > 0 ? Math.round((g.present / g.total) * 100) : 0
                return (
                  <Link
                    key={i}
                    href={`/admin/attendance?class_id=${g.classId}&date=${g.date}`}
                    className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{g.className}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(g.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        rate >= 60 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {g.present}/{g.total} — {rate}%
                      </span>
                    </div>
                  </Link>
                )
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Aucune session enregistrée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
