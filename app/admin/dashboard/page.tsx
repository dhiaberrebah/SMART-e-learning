import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AttendanceChart, DayStats } from '@/components/admin/AttendanceChart'
import { UsersRoleChart } from '@/components/admin/UsersRoleChart'
import { StudentsPerClassChart } from '@/components/admin/StudentsPerClassChart'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 7-day attendance window
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  const [
    { count: totalUsers },
    { count: teachersCount },
    { count: parentsCount },
    { count: adminsCount },
    { count: totalStudents },
    { count: totalClasses },
    { count: studentsWithClass },
    { data: recentUsers },
    { data: recentStudents },
    { data: attendanceRaw },
    { data: classesWithStudents },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).not('class_id', 'is', null),
    supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('students')
      .select('id, full_name, student_number, created_at, class:classes(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('attendance')
      .select('date, status')
      .gte('date', sevenDaysAgoStr)
      .order('date'),
    supabase
      .from('classes')
      .select('name, students(count)')
      .order('name')
      .limit(10),
  ])

  // Build 7-day attendance stats array
  const attendanceByDate = new Map<string, { present: number; absent: number; late: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    attendanceByDate.set(d.toISOString().split('T')[0], { present: 0, absent: 0, late: 0 })
  }
  ;(attendanceRaw ?? []).forEach((row: any) => {
    const entry = attendanceByDate.get(row.date)
    if (!entry) return
    if (row.status === 'present') entry.present++
    else if (row.status === 'absent') entry.absent++
    else if (row.status === 'late') entry.late++
  })

  // Students per class data
  const classChartData = (classesWithStudents ?? []).map((c: any) => ({
    name: c.name,
    students: c.students?.[0]?.count ?? 0,
  }))

  const FR_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const chartData: DayStats[] = Array.from(attendanceByDate.entries()).map(([date, stats]) => {
    const d = new Date(date + 'T00:00:00')
    return {
      date,
      label: `${FR_DAYS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}`,
      ...stats,
    }
  })

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      teacher: 'Enseignant',
      parent: 'Parent',
    }
    return labels[role] || role
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      teacher: 'bg-green-100 text-green-700',
      parent: 'bg-blue-100 text-blue-700',
    }
    return badges[role] || 'bg-gray-100 text-gray-700'
  }

  const stats = [
    { label: 'Total utilisateurs', value: totalUsers || 0, color: 'bg-indigo-500', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, href: '/admin/users' },
    { label: 'Enseignants', value: teachersCount || 0, color: 'bg-emerald-500', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, href: '/admin/users' },
    { label: 'Parents', value: parentsCount || 0, color: 'bg-blue-500', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, href: '/admin/users' },
    { label: 'Élèves', value: totalStudents || 0, color: 'bg-purple-500', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>, href: '/admin/students' },
    { label: 'Classes', value: totalClasses || 0, color: 'bg-amber-500', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, href: '/admin/classes' },
  ]

  const quickActions = [
    { href: '/admin/users/add',         label: 'Ajouter un utilisateur', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { href: '/admin/students/add',      label: 'Ajouter un élève',       color: 'bg-purple-600 hover:bg-purple-700' },
    { href: '/admin/classes/add',       label: 'Créer une classe',        color: 'bg-amber-600 hover:bg-amber-700' },
    { href: '/admin/timetable',         label: 'Emploi du temps',         color: 'bg-slate-600 hover:bg-slate-700' },
    { href: '/admin/announcements/add', label: 'Nouvel événement',        color: 'bg-teal-600 hover:bg-teal-700' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">
          Bienvenue —{' '}
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href || '#'}
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${a.color}`}
            >
              + {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Charts row 1 — Attendance (full width) */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Tendance des présences</h2>
            <p className="text-xs text-gray-500 mt-0.5">7 derniers jours — présents, absents, en retard</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 rounded inline-block" />
              Présents
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-500 rounded inline-block" />
              Absents
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 rounded inline-block" />
              En retard
            </span>
          </div>
        </div>
        <AttendanceChart data={chartData} />
      </div>

      {/* Charts row 2 — Role donut + Students per class bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-0.5">Répartition des utilisateurs</h2>
          <p className="text-xs text-gray-500 mb-4">Par rôle — enseignants, parents, admins</p>
          <UsersRoleChart
            teachers={teachersCount ?? 0}
            parents={parentsCount ?? 0}
            admins={adminsCount ?? 0}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-0.5">Élèves par classe</h2>
          <p className="text-xs text-gray-500 mb-4">Nombre d&apos;élèves dans chaque classe (top 10)</p>
          <StudentsPerClassChart data={classChartData} />
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Derniers utilisateurs</h2>
            <Link href="/admin/users" className="text-sm text-indigo-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers?.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 text-xs font-bold">{u.full_name?.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadge(u.role)}`}>
                  {getRoleLabel(u.role)}
                </span>
              </div>
            ))}
            {!recentUsers?.length && (
              <p className="text-sm text-gray-400 text-center py-6">Aucun utilisateur</p>
            )}
          </div>
        </div>

        {/* Recent students */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Derniers élèves</h2>
            <Link href="/admin/students" className="text-sm text-indigo-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentStudents?.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-700 text-xs font-bold">{s.full_name?.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.full_name}</p>
                  <p className="text-xs text-gray-400">{s.student_number || 'N° —'}</p>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {s.class?.name || 'Sans classe'}
                </span>
              </div>
            ))}
            {!recentStudents?.length && (
              <p className="text-sm text-gray-400 text-center py-6">Aucun élève</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white">
          <p className="text-indigo-200 text-sm mb-1">Élèves inscrits en classe</p>
          <p className="text-3xl font-bold">{studentsWithClass || 0}</p>
          <p className="text-indigo-200 text-xs mt-1">sur {totalStudents || 0} élèves total</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <p className="text-emerald-200 text-sm mb-1">Ratio élèves / classe</p>
          <p className="text-3xl font-bold">
            {totalClasses && totalStudents
              ? Math.round((totalStudents || 0) / (totalClasses || 1))
              : 0}
          </p>
          <p className="text-emerald-200 text-xs mt-1">élèves en moyenne par classe</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <p className="text-purple-200 text-sm mb-1">Administrateurs</p>
          <p className="text-3xl font-bold">{adminsCount || 0}</p>
          <p className="text-purple-200 text-xs mt-1">compte(s) admin actif(s)</p>
        </div>
      </div>
    </div>
  )
}
