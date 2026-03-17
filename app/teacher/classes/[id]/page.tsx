import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const { data: cls } = await db
    .from('classes')
    .select('id, name, description, grade_level, academic_year')
    .eq('id', id)
    .eq('teacher_id', user!.id)
    .single()

  if (!cls) notFound()

  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [{ data: students }, { data: subjects }, { data: attendance }] = await Promise.all([
    db.from('students').select('id, full_name, student_number, date_of_birth').eq('class_id', id).order('full_name'),
    db.from('subjects').select('id, name, description').eq('class_id', id).order('name'),
    db.from('attendance').select('date, status, student_id').eq('class_id', id).gte('date', last30).order('date', { ascending: false }),
  ])

  const studentIds = (students ?? []).map((s: any) => s.id)

  const { data: grades } = studentIds.length > 0
    ? await db.from('grades').select('grade_value, max_grade, student_id, subject_id').in('student_id', studentIds)
    : Promise.resolve({ data: [] })

  const getStudentAttendanceRate = (studentId: string) => {
    const recs = (attendance ?? []).filter((a: any) => a.student_id === studentId)
    if (!recs.length) return null
    const present = recs.filter((a: any) => a.status === 'present').length
    return Math.round((present / recs.length) * 100)
  }

  const getStudentAvg = (studentId: string) => {
    const recs = (grades ?? []).filter((g: any) => g.student_id === studentId)
    if (!recs.length) return null
    const sum = recs.reduce((acc: number, g: any) => acc + (g.grade_value / g.max_grade) * 20, 0)
    return (sum / recs.length).toFixed(1)
  }

  // Attendance by date (unique sessions)
  const sessions = [...new Set((attendance ?? []).map((a: any) => a.date))].slice(0, 7)

  const presentTotal = (attendance ?? []).filter((a: any) => a.status === 'present').length
  const totalRec = (attendance ?? []).length
  const overallRate = totalRec > 0 ? Math.round((presentTotal / totalRec) * 100) : null

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/teacher/classes" className="text-sm text-blue-600 hover:underline">Classes</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">{cls.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
          {cls.grade_level && <p className="text-gray-500 text-sm mt-1">{cls.grade_level} · {cls.academic_year ?? ''}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/attendance?class_id=${id}`}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Saisir présences
          </Link>
          <Link href={`/teacher/grades/add?class_id=${id}`}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ajouter note
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-3xl font-bold text-gray-900">{(students ?? []).length}</p>
          <p className="text-sm text-gray-500">Élèves</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-3xl font-bold text-gray-900">{(subjects ?? []).length}</p>
          <p className="text-sm text-gray-500">Matières</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-3xl font-bold text-gray-900">{overallRate !== null ? `${overallRate}%` : '—'}</p>
          <p className="text-sm text-gray-500">Taux présence (30j)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Liste des élèves</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Nom</th>
                  <th className="px-5 py-3 text-left">N° élève</th>
                  <th className="px-4 py-3 text-center">Présence</th>
                  <th className="px-4 py-3 text-center">Moy./20</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(students ?? []).length > 0 ? (
                  (students as any[]).map((s) => {
                    const rate = getStudentAttendanceRate(s.id)
                    const avg = getStudentAvg(s.id)
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 text-sm">
                        <td className="px-5 py-3 font-medium text-gray-900">{s.full_name}</td>
                        <td className="px-5 py-3 text-gray-500">{s.student_number}</td>
                        <td className="px-4 py-3 text-center">
                          {rate !== null ? (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rate >= 80 ? 'bg-emerald-100 text-emerald-700' : rate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {rate}%
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {avg !== null ? (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${Number(avg) >= 14 ? 'bg-emerald-100 text-emerald-700' : Number(avg) >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {avg}/20
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link href={`/teacher/grades?student_id=${s.id}`} className="text-xs text-blue-600 hover:underline">Notes</Link>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-6 text-sm">Aucun élève inscrit</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Matières</h2>
            <Link href={`/teacher/subjects/add?class_id=${id}`} className="text-xs text-blue-600 hover:underline">+ Ajouter</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(subjects ?? []).length > 0 ? (
              (subjects as any[]).map((sub) => (
                <div key={sub.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                  {sub.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{sub.description}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucune matière</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent attendance sessions */}
      {sessions.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Séances récentes (7 dernières)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Date</th>
                  {(students as any[] ?? []).map((s: any) => (
                    <th key={s.id} className="px-3 py-3 text-center text-xs font-normal max-w-20 truncate">{s.full_name.split(' ')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.map((date) => (
                  <tr key={date as string} className="text-sm">
                    <td className="px-5 py-2 text-gray-600 whitespace-nowrap">
                      {new Date(date as string).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </td>
                    {(students as any[] ?? []).map((s: any) => {
                      const rec = (attendance ?? []).find((a: any) => a.date === date && a.student_id === s.id)
                      const badge: Record<string, string> = { present: '✓', absent: '✗', late: '~', excused: 'E' }
                      const color: Record<string, string> = { present: 'text-emerald-600', absent: 'text-red-500', late: 'text-amber-500', excused: 'text-blue-500' }
                      return (
                        <td key={s.id} className={`px-3 py-2 text-center font-bold ${rec ? color[rec.status] : 'text-gray-200'}`}>
                          {rec ? (badge[rec.status] ?? rec.status) : '·'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
