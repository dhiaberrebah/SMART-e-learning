import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: teachersCount },
    { count: parentsCount },
    { count: totalStudents },
    { count: studentsWithClass },
    { count: totalClasses },
    { data: classesFull },
    { data: allAttendance },
    { data: recentGrades },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).not('class_id', 'is', null),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
    supabase
      .from('classes')
      .select(`id, name, grade_level, students(count), teacher:profiles!classes_teacher_id_fkey(full_name)`)
      .order('name'),
    supabase
      .from('attendance')
      .select('status, date, class_id, class:classes(name)')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    supabase
      .from('grades')
      .select('grade_value, max_grade, grade_type, date, subject:subjects(name), student:students(full_name)')
      .order('date', { ascending: false })
      .limit(20),
  ])

  // Attendance stats
  const presentCount = allAttendance?.filter(a => a.status === 'present').length || 0
  const totalAttendance = allAttendance?.length || 0
  const overallRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null

  const statusBreakdown = {
    present: allAttendance?.filter(a => a.status === 'present').length || 0,
    absent: allAttendance?.filter(a => a.status === 'absent').length || 0,
    late: allAttendance?.filter(a => a.status === 'late').length || 0,
    excused: allAttendance?.filter(a => a.status === 'excused').length || 0,
  }

  // Attendance by class (last 30 days)
  const attendanceByClass = allAttendance?.reduce((acc: Record<string, { name: string; total: number; present: number }>, a: any) => {
    if (!a.class_id) return acc
    if (!acc[a.class_id]) acc[a.class_id] = { name: a.class?.name || '?', total: 0, present: 0 }
    acc[a.class_id].total++
    if (a.status === 'present') acc[a.class_id].present++
    return acc
  }, {})

  const classAttendanceList = Object.values(attendanceByClass || {})
    .map(c => ({ ...c, rate: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0 }))
    .sort((a, b) => b.rate - a.rate)

  // Grade stats
  const validGrades = recentGrades?.filter(g => g.grade_value !== null && g.max_grade !== null) || []
  const avgGrade = validGrades.length > 0
    ? (validGrades.reduce((sum, g) => sum + ((g.grade_value / g.max_grade) * 100), 0) / validGrades.length).toFixed(1)
    : null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
        <p className="text-gray-500 mt-1">Vue d&apos;ensemble de l&apos;établissement</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Utilisateurs', value: totalUsers || 0, sub: `${teachersCount || 0} enseignants · ${parentsCount || 0} parents`, color: 'indigo' },
          { label: 'Élèves', value: totalStudents || 0, sub: `${studentsWithClass || 0} inscrits en classe`, color: 'purple' },
          { label: 'Classes', value: totalClasses || 0, sub: `${(totalClasses || 0) > 0 ? Math.round((totalStudents || 0) / (totalClasses || 1)) : 0} élèves/classe en moy.`, color: 'amber' },
          { label: 'Taux de présence (30j)', value: overallRate !== null ? `${overallRate}%` : '—', sub: `${totalAttendance} présences enregistrées`, color: 'emerald' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 border-${s.color}-500`}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Attendance breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Répartition des présences (30 derniers jours)</h2>
          {totalAttendance > 0 ? (
            <div className="space-y-3">
              {[
                { key: 'present', label: 'Présent', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                { key: 'absent', label: 'Absent', color: 'bg-red-500', textColor: 'text-red-600' },
                { key: 'late', label: 'En retard', color: 'bg-amber-500', textColor: 'text-amber-600' },
                { key: 'excused', label: 'Excusé', color: 'bg-blue-500', textColor: 'text-blue-600' },
              ].map(item => {
                const count = statusBreakdown[item.key as keyof typeof statusBreakdown]
                const pct = totalAttendance > 0 ? Math.round((count / totalAttendance) * 100) : 0
                return (
                  <div key={item.key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-medium ${item.textColor}`}>{item.label}</span>
                      <span className="text-sm text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-2 ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Aucune donnée de présence</p>
          )}
        </div>

        {/* Students per class */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Élèves par classe</h2>
          <div className="space-y-3">
            {classesFull && classesFull.length > 0 ? (
              classesFull.map((cls: any) => {
                const count = cls.students?.[0]?.count || 0
                const maxStudents = Math.max(...(classesFull.map((c: any) => c.students?.[0]?.count || 0)))
                const pct = maxStudents > 0 ? Math.round((count / maxStudents) * 100) : 0
                return (
                  <div key={cls.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{cls.name}</span>
                      <span className="text-sm text-gray-500">{count} élève(s)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucune classe</p>
            )}
          </div>
        </div>
      </div>

      {/* Attendance by class table */}
      {classAttendanceList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Taux de présence par classe (30j)</h2>
            <Link href="/admin/attendance" className="text-xs text-indigo-600 hover:underline">Gérer les présences</Link>
          </div>
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50">
              <tr>
                {['Classe', 'Total enregistrements', 'Présents', 'Absents', 'Taux'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {classAttendanceList.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{c.total}</td>
                  <td className="px-5 py-3 text-sm text-emerald-600 font-medium">{c.present}</td>
                  <td className="px-5 py-3 text-sm text-red-500">{c.total - c.present}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      c.rate >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {c.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent grades */}
      {validGrades.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Notes récentes</h2>
            <span className="text-xs text-gray-400">Moyenne : {avgGrade ? `${avgGrade}%` : '—'}</span>
          </div>
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50">
              <tr>
                {['Élève', 'Matière', 'Note', 'Type', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentGrades?.slice(0, 10).map((g: any) => {
                const pct = g.max_grade > 0 ? Math.round((g.grade_value / g.max_grade) * 100) : 0
                return (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{g.student?.full_name || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{g.subject?.name || '—'}</td>
                    <td className="px-5 py-3 text-sm font-semibold">
                      <span className={pct >= 60 ? 'text-emerald-600' : 'text-red-500'}>
                        {g.grade_value}/{g.max_grade}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{g.grade_type || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {g.date ? new Date(g.date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
