import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Get all children of this parent
  const { data: children } = await supabase
    .from('students')
    .select(`
      *,
      class:classes(id, name, grade_level, teacher:profiles!classes_teacher_id_fkey(full_name))
    `)
    .eq('parent_id', user!.id)
    .order('full_name')

  const childIds = children?.map(c => c.id) || []

  // Attendance for last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const { data: recentAttendance } = await supabase
    .from('attendance')
    .select('student_id, status, date')
    .in('student_id', childIds.length > 0 ? childIds : ['none'])
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false })

  // Recent grades
  const { data: recentGrades } = await supabase
    .from('grades')
    .select(`
      *,
      subject:subjects(name),
      student:students(full_name)
    `)
    .in('student_id', childIds.length > 0 ? childIds : ['none'])
    .order('date', { ascending: false })
    .limit(5)

  // Upcoming events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, start_at, location')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(3)

  // Today's attendance
  const todayAttendance = recentAttendance?.filter(a => a.date === today) || []

  // Compute per-child attendance rates
  const childAttendanceStats = children?.map(child => {
    const childRecords = recentAttendance?.filter(a => a.student_id === child.id) || []
    const present = childRecords.filter(a => a.status === 'present').length
    const total = childRecords.length
    const todayRecord = todayAttendance.find(a => a.student_id === child.id)
    return {
      ...child,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : null,
      totalRecords: total,
      todayStatus: todayRecord?.status || null,
    }
  })

  const statusColors: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
    excused: 'bg-blue-100 text-blue-700',
  }
  const statusLabels: Record<string, string> = {
    present: 'Présent aujourd\'hui',
    absent: 'Absent aujourd\'hui',
    late: 'En retard aujourd\'hui',
    excused: 'Excusé aujourd\'hui',
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {children && children.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <h3 className="mt-3 text-sm font-semibold text-gray-700">Aucun enfant associé</h3>
          <p className="mt-1 text-sm text-gray-400">Contactez l&apos;administration pour associer vos enfants à votre compte</p>
        </div>
      ) : (
        <>
          {/* Children cards */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Mes enfants</h2>
              <Link href="/parent/children" className="text-sm text-emerald-600 hover:underline">Voir tout</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {childAttendanceStats?.map((child: any) => (
                <Link
                  key={child.id}
                  href={`/parent/children/${child.id}`}
                  className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-transparent hover:border-emerald-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 text-lg font-bold">
                        {child.full_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{child.full_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {child.class?.name || 'Classe non assignée'}
                        {child.class?.grade_level ? ` · ${child.class.grade_level}` : ''}
                      </p>
                      {child.class?.teacher && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Enseignant : {child.class.teacher.full_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {child.todayStatus ? (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[child.todayStatus]}`}>
                        {statusLabels[child.todayStatus]}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                        Pas encore marqué
                      </span>
                    )}
                    {child.attendanceRate !== null && (
                      <span className={`text-xs font-semibold ${child.attendanceRate >= 80 ? 'text-emerald-600' : child.attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {child.attendanceRate}% présence (30j)
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent grades */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="font-semibold text-gray-900">Dernières notes</h2>
                <Link href="/parent/grades" className="text-sm text-emerald-600 hover:underline">Voir tout</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentGrades && recentGrades.length > 0 ? (
                  recentGrades.map((g: any) => {
                    const pct = g.max_grade > 0 ? Math.round((g.grade_value / g.max_grade) * 100) : 0
                    return (
                      <div key={g.id} className="flex items-center gap-4 px-5 py-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${pct >= 70 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {g.grade_value}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{g.subject?.name || 'Matière inconnue'}</p>
                          <p className="text-xs text-gray-400">
                            {g.student?.full_name} ·{' '}
                            {g.date ? new Date(g.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-700">{g.grade_value}/{g.max_grade}</p>
                          <p className={`text-xs font-medium ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {pct}%
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Aucune note disponible</p>
                )}
              </div>
            </div>

            {/* Upcoming events */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="font-semibold text-gray-900">Événements à venir</h2>
                <Link href="/parent/events" className="text-sm text-emerald-600 hover:underline">Voir tout</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.map((e) => {
                    const d = new Date(e.start_at)
                    return (
                      <div key={e.id} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-700 leading-none">
                              {d.toLocaleDateString('fr-FR', { day: 'numeric' })}
                            </span>
                            <span className="text-xs text-indigo-500 uppercase leading-none mt-0.5">
                              {d.toLocaleDateString('fr-FR', { month: 'short' })}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 leading-tight">{e.title}</p>
                            {e.location && (
                              <p className="text-xs text-gray-400 mt-0.5">{e.location}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Aucun événement prévu</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: '/parent/children', label: 'Mes enfants', icon: '👨‍👧', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              { href: '/parent/attendance', label: 'Présences', icon: '📋', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { href: '/parent/grades', label: 'Notes', icon: '📊', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
              { href: '/parent/events', label: 'Événements', icon: '📅', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`${item.color} rounded-xl p-4 text-center transition-colors`}
              >
                <p className="text-2xl mb-1">{item.icon}</p>
                <p className="text-sm font-medium">{item.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
