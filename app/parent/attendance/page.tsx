import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ child_id?: string; month?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get parent's children
  const { data: children } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('parent_id', user!.id)
    .order('full_name')

  const childIds = children?.map(c => c.id) || []
  const selectedChildId = sp.child_id || ''

  // Determine month range
  const now = new Date()
  const monthStr = sp.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = monthStr.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

  // Previous / next month
  const prevMonth = new Date(year, month - 2, 1)
  const nextMonth = new Date(year, month, 1)
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
  const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`

  // Fetch attendance
  let query = supabase
    .from('attendance')
    .select(`student_id, date, status, notes, student:students(full_name)`)
    .in('student_id', childIds.length > 0 ? childIds : ['none'])
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: false })

  if (selectedChildId) {
    query = query.eq('student_id', selectedChildId)
  }

  const { data: attendanceRecords } = await query

  // Stats
  const present = attendanceRecords?.filter(a => a.status === 'present').length || 0
  const absent = attendanceRecords?.filter(a => a.status === 'absent').length || 0
  const late = attendanceRecords?.filter(a => a.status === 'late').length || 0
  const excused = attendanceRecords?.filter(a => a.status === 'excused').length || 0
  const total = attendanceRecords?.length || 0
  const rate = total > 0 ? Math.round((present / total) * 100) : null

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

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Présences</h1>
        <p className="text-gray-500 mt-1">Suivi des présences de vos enfants</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <form method="GET" className="flex flex-wrap gap-3 items-center">
          <select
            name="child_id"
            defaultValue={selectedChildId}
            className="px-3 py-2 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tous les enfants</option>
            {children?.map(c => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
          <input type="hidden" name="month" value={monthStr} />
          <div className="flex items-center gap-2">
            <Link
              href={`/parent/attendance?child_id=${selectedChildId}&month=${prevMonthStr}`}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="text-sm font-medium text-gray-700 capitalize min-w-[140px] text-center">{monthName}</span>
            <Link
              href={`/parent/attendance?child_id=${selectedChildId}&month=${nextMonthStr}`}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            Filtrer
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: total, color: 'text-gray-900' },
          { label: 'Présents', value: present, color: 'text-emerald-600' },
          { label: 'Absents', value: absent, color: 'text-red-600' },
          { label: 'Retards', value: late, color: 'text-amber-600' },
          { label: 'Taux', value: rate !== null ? `${rate}%` : '—', color: rate !== null && rate >= 80 ? 'text-emerald-600' : rate !== null && rate >= 60 ? 'text-amber-600' : 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance list */}
      {total > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              {total} enregistrement(s) pour {monthName}
              {selectedChildId && children?.find(c => c.id === selectedChildId)
                ? ` · ${children.find(c => c.id === selectedChildId)?.full_name}`
                : ''}
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {attendanceRecords?.map((a: any, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="w-12 text-center flex-shrink-0">
                  <p className="text-base font-bold text-gray-800">
                    {new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 uppercase">
                    {new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  {!selectedChildId && (
                    <p className="text-sm font-medium text-gray-800">{a.student?.full_name}</p>
                  )}
                  <p className="text-xs text-gray-400 capitalize">
                    {new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long' })}
                  </p>
                  {a.notes && <p className="text-xs text-gray-400 italic mt-0.5">{a.notes}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusColors[a.status]}`}>
                  {statusLabels[a.status] || a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-sm font-medium text-gray-700">Aucune donnée pour {monthName}</h3>
          <p className="text-xs text-gray-400 mt-1">Les présences apparaîtront ici une fois enregistrées</p>
        </div>
      )}
    </div>
  )
}
