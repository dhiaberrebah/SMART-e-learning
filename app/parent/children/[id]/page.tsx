import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify this child belongs to the logged-in parent
  const { data: child } = await supabase
    .from('students')
    .select(`
      *,
      class:classes(id, name, grade_level, academic_year, teacher:profiles!classes_teacher_id_fkey(full_name, email))
    `)
    .eq('id', id)
    .eq('parent_id', user!.id)
    .maybeSingle()

  if (!child) redirect('/parent/children')

  const [{ data: attendance }, { data: grades }, { data: subjects }] = await Promise.all([
    supabase
      .from('attendance')
      .select('date, status, notes')
      .eq('student_id', id)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('grades')
      .select(`*, subject:subjects(name)`)
      .eq('student_id', id)
      .order('date', { ascending: false }),
    supabase
      .from('subjects')
      .select('id, name')
      .eq('class_id', (child as any).class?.id || '')
      .order('name'),
  ])

  // Attendance stats
  const presentCount = attendance?.filter(a => a.status === 'present').length || 0
  const absentCount = attendance?.filter(a => a.status === 'absent').length || 0
  const lateCount = attendance?.filter(a => a.status === 'late').length || 0
  const totalCount = attendance?.length || 0
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null

  // Grade stats
  const validGrades = grades?.filter(g => g.grade_value !== null && g.max_grade > 0) || []
  const avgGrade = validGrades.length > 0
    ? (validGrades.reduce((s, g) => s + (g.grade_value / g.max_grade) * 100, 0) / validGrades.length)
    : null

  // Group grades by subject
  const gradesBySubject = grades?.reduce((acc: Record<string, any[]>, g: any) => {
    const subName = g.subject?.name || 'Autre'
    if (!acc[subName]) acc[subName] = []
    acc[subName].push(g)
    return acc
  }, {}) || {}

  const statusColors: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
    excused: 'bg-blue-100 text-blue-700',
  }
  const statusLabels: Record<string, string> = {
    present: 'Présent',
    absent: 'Absent',
    late: 'En retard',
    excused: 'Excusé',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/parent/children" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-700 font-bold">{(child as any).full_name?.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{(child as any).full_name}</h1>
            <p className="text-gray-500 text-sm">
              {(child as any).class?.name || 'Classe non assignée'}
              {(child as any).class?.grade_level ? ` · ${(child as any).class.grade_level}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${attendanceRate !== null && attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate !== null && attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {attendanceRate !== null ? `${attendanceRate}%` : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Taux de présence</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          <p className="text-xs text-gray-500 mt-1">Absences</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${avgGrade !== null && avgGrade >= 70 ? 'text-emerald-600' : avgGrade !== null && avgGrade >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {avgGrade !== null ? `${Math.round(avgGrade)}%` : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Moyenne générale</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{validGrades.length}</p>
          <p className="text-xs text-gray-500 mt-1">Notes reçues</p>
        </div>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Informations de l&apos;élève</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'N° élève', value: (child as any).student_number || '—' },
            { label: 'Date de naissance', value: (child as any).date_of_birth ? new Date((child as any).date_of_birth).toLocaleDateString('fr-FR') : '—' },
            { label: 'Enseignant', value: (child as any).class?.teacher?.full_name || '—' },
            { label: 'Année scolaire', value: (child as any).class?.academic_year || '—' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
              <p className="font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance history */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Présences récentes</h2>
            <Link href={`/parent/attendance?child_id=${id}`} className="text-xs text-emerald-600 hover:underline">
              Voir tout
            </Link>
          </div>
          {/* Mini stats bar */}
          <div className="flex divide-x divide-gray-100 bg-gray-50">
            {[
              { label: 'Présents', count: presentCount, color: 'text-emerald-600' },
              { label: 'Absents', count: absentCount, color: 'text-red-600' },
              { label: 'Retards', count: lateCount, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="flex-1 text-center py-2">
                <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {attendance && attendance.length > 0 ? (
              attendance.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="text-center w-12 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400 uppercase">
                      {new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[a.status]}`}>
                      {statusLabels[a.status] || a.status}
                    </span>
                    {a.notes && <p className="text-xs text-gray-400 mt-0.5">{a.notes}</p>}
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Aucun enregistrement</p>
            )}
          </div>
        </div>

        {/* Grades by subject */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Notes par matière</h2>
            <Link href={`/parent/grades?child_id=${id}`} className="text-xs text-emerald-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {Object.keys(gradesBySubject).length > 0 ? (
              Object.entries(gradesBySubject).map(([subject, subGrades]: [string, any[]]) => {
                const validSub = subGrades.filter(g => g.max_grade > 0)
                const subAvg = validSub.length > 0
                  ? Math.round(validSub.reduce((s, g) => s + (g.grade_value / g.max_grade) * 100, 0) / validSub.length)
                  : null
                return (
                  <div key={subject} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-800">{subject}</p>
                      {subAvg !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${subAvg >= 70 ? 'bg-emerald-100 text-emerald-700' : subAvg >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          Moy. {subAvg}%
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {subGrades.slice(0, 3).map((g, i) => {
                        const pct = g.max_grade > 0 ? Math.round((g.grade_value / g.max_grade) * 100) : 0
                        return (
                          <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                            <span>{g.grade_type || 'Évaluation'} · {g.date ? new Date(g.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</span>
                            <span className={`font-semibold ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                              {g.grade_value}/{g.max_grade}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Aucune note disponible</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
