import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { getTeacherClassIds } from '@/lib/teacher-classes'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const classIds = await getTeacherClassIds(db, user!.id)

  const [
    classes,
    { data: subjects },
    { data: assessments },
    { data: recentSubmissions },
    { data: upcomingEvents },
    { data: adminMessages },
  ] = await Promise.all([
    classIds.length > 0
      ? db.from('classes').select('id, name, grade_level').in('id', classIds).order('name').then((r: any) => r.data ?? [])
      : Promise.resolve([]),
    db.from('subjects').select('id, name, class_id').eq('teacher_id', user!.id).order('name'),
    db.from('assessments').select('id, title, status, created_at').eq('teacher_id', user!.id).order('created_at', { ascending: false }).limit(5),
    db.from('assessment_submissions').select('id, status, submitted_at, student:students(full_name), assessment:assessments(title, teacher_id)').eq('assessments.teacher_id', user!.id).order('submitted_at', { ascending: false }).limit(5),
    db.from('events').select('id, title, start_at, location').gte('start_at', new Date().toISOString()).order('start_at', { ascending: true }).limit(3),
    supabase
      .from('admin_broadcast_messages')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  // Students in teacher's classes
  const { data: students } = classIds.length > 0
    ? await db.from('students').select('id, full_name, class_id').in('class_id', classIds)
    : Promise.resolve({ data: [] })

  // Today's attendance for teacher's classes
  const todayAttendance = classIds.length > 0
    ? await db.from('attendance').select('status, class_id').in('class_id', classIds).eq('date', today)
    : { data: [] }

  const presentToday = (todayAttendance.data ?? []).filter((a: any) => a.status === 'present').length
  const totalToday = (todayAttendance.data ?? []).length
  const todayRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : null

  const pendingSubmissions = (recentSubmissions ?? []).filter((s: any) => s.status === 'submitted').length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const stats = [
    { label: 'Mes classes', value: (classes ?? []).length, icon: '🏫', href: '/teacher/classes', color: 'bg-blue-50 border-blue-200' },
    { label: 'Mes élèves', value: (students ?? []).length, icon: '👨‍🎓', href: '/teacher/students', color: 'bg-indigo-50 border-indigo-200' },
    { label: 'Mes matières', value: (subjects ?? []).length, icon: '📚', href: '/teacher/subjects', color: 'bg-purple-50 border-purple-200' },
    { label: 'Présences aujourd\'hui', value: todayRate !== null ? `${todayRate}%` : '—', sub: totalToday > 0 ? `${presentToday}/${totalToday}` : 'Non marquées', icon: '✅', href: '/teacher/attendance', color: 'bg-emerald-50 border-emerald-200' },
    { label: 'Évaluations', value: (assessments ?? []).length, icon: '📝', href: '/teacher/assessments', color: 'bg-amber-50 border-amber-200' },
    { label: 'Soumissions en attente', value: pendingSubmissions, icon: '⏳', href: '/teacher/assessments', color: 'bg-red-50 border-red-200' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {adminMessages && adminMessages.length > 0 && (
        <div className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-sm font-semibold text-indigo-900">Messages administration</h2>
            <Link href="/teacher/admin-messages" className="text-xs font-medium text-indigo-700 hover:underline">
              Voir tout
            </Link>
          </div>
          <ul className="space-y-2">
            {(adminMessages ?? []).map((m: { id: string; title: string; created_at: string }) => (
              <li key={m.id}>
                <Link
                  href="/teacher/admin-messages"
                  className="block text-sm text-indigo-950 hover:text-indigo-700 font-medium"
                >
                  {m.title}
                </Link>
                <p className="text-xs text-indigo-600/80">
                  {new Date(m.created_at).toLocaleString('fr-FR')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`bg-white rounded-xl shadow-sm p-4 border hover:shadow-md transition-shadow ${s.color}`}>
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/teacher/attendance', label: '+ Saisir les présences', color: 'bg-emerald-600 hover:bg-emerald-700' },
            { href: '/teacher/grades/add', label: '+ Ajouter une note', color: 'bg-blue-600 hover:bg-blue-700' },
            { href: '/teacher/assessments/add', label: '+ Créer une évaluation', color: 'bg-amber-600 hover:bg-amber-700' },
            { href: '/teacher/content/add', label: '+ Ajouter un cours', color: 'bg-purple-600 hover:bg-purple-700' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${a.color}`}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My classes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Mes classes</h2>
            <Link href="/teacher/classes" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(classes ?? []).length > 0 ? (
              (classes as any[]).map((cls) => {
                const count = (students ?? []).filter((s: any) => s.class_id === cls.id).length
                return (
                  <Link key={cls.id} href={`/teacher/classes/${cls.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 text-xs font-bold">{cls.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{cls.name}</p>
                      <p className="text-xs text-gray-400">{cls.grade_level ?? ''}</p>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count} élèves</span>
                  </Link>
                )
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucune classe assignée</p>
            )}
          </div>
        </div>

        {/* Recent assessments */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Évaluations récentes</h2>
            <Link href="/teacher/assessments" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(assessments ?? []).length > 0 ? (
              (assessments as any[]).map((a) => {
                const statusBadge: Record<string, string> = {
                  draft: 'bg-gray-100 text-gray-500',
                  published: 'bg-blue-100 text-blue-700',
                  closed: 'bg-emerald-100 text-emerald-700',
                }
                const statusLabel: Record<string, string> = {
                  draft: 'Brouillon',
                  published: 'Publié',
                  closed: 'Clôturé',
                }
                return (
                  <Link key={a.id} href={`/teacher/assessments/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[a.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {statusLabel[a.status] ?? a.status}
                    </span>
                  </Link>
                )
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucune évaluation créée</p>
            )}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Événements à venir</h2>
            <Link href="/teacher/events" className="text-sm text-blue-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(upcomingEvents ?? []).length > 0 ? (
              (upcomingEvents as any[]).map((e) => {
                const d = new Date(e.start_at)
                return (
                  <div key={e.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-700 leading-none">{d.toLocaleDateString('fr-FR', { day: 'numeric' })}</span>
                      <span className="text-xs text-indigo-500 uppercase">{d.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{e.title}</p>
                      {e.location && <p className="text-xs text-gray-400 mt-0.5">{e.location}</p>}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucun événement</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
