import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PRIMARY_GRADE_OPTIONS_TUNISIA } from '@/lib/grade-levels'

const DAY_OPTIONS = [7, 30, 60, 90, 180] as const

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; niveau?: string }>
}) {
  const sp = await searchParams
  const daysRaw = parseInt(sp.days || '30', 10)
  const days = DAY_OPTIONS.includes(daysRaw as (typeof DAY_OPTIONS)[number])
    ? daysRaw
    : 30
  const niveauFilter = (sp.niveau || '').trim()

  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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
    { data: periodGrades },
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
      .select('status, date, class_id')
      .gte('date', fromDate),
    supabase
      .from('grades')
      .select('grade_value, max_grade, date, student:students(class_id)')
      .gte('date', fromDate)
      .not('grade_value', 'is', null)
      .not('max_grade', 'is', null),
    supabase
      .from('grades')
      .select('id, grade_value, max_grade, grade_type, date, subject:subjects(name), student:students(full_name)')
      .order('date', { ascending: false })
      .limit(20),
  ])

  const classById = new Map((classesFull ?? []).map((c: any) => [c.id, c]))

  const classMatchesNiveau = (classId: string) => {
    if (!niveauFilter) return true
    const c = classById.get(classId) as { grade_level?: string } | undefined
    return (c?.grade_level || '') === niveauFilter
  }

  const attendanceFiltered =
    allAttendance?.filter((a: any) => a.class_id && classMatchesNiveau(a.class_id)) ?? []

  const presentCount = attendanceFiltered.filter((a) => a.status === 'present').length
  const totalAttendance = attendanceFiltered.length
  const overallRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null

  const statusBreakdown = {
    present: attendanceFiltered.filter((a) => a.status === 'present').length,
    absent: attendanceFiltered.filter((a) => a.status === 'absent').length,
    late: attendanceFiltered.filter((a) => a.status === 'late').length,
    excused: attendanceFiltered.filter((a) => a.status === 'excused').length,
  }

  type Agg = {
    classId: string
    name: string
    grade_level: string | null
    total: number
    present: number
    absent: number
    late: number
    excused: number
  }

  const aggMap = new Map<string, Agg>()

  for (const a of attendanceFiltered) {
    const cid = a.class_id as string
    if (!aggMap.has(cid)) {
      const c = classById.get(cid) as any
      aggMap.set(cid, {
        classId: cid,
        name: c?.name || 'Classe',
        grade_level: c?.grade_level ?? null,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      })
    }
    const row = aggMap.get(cid)!
    row.total++
    if (a.status === 'present') row.present++
    else if (a.status === 'absent') row.absent++
    else if (a.status === 'late') row.late++
    else if (a.status === 'excused') row.excused++
  }

  /** Plus d’absences en premier (puis taux d’absence si ex aequo) */
  const absenceRanking = Array.from(aggMap.values())
    .filter((r) => r.total > 0)
    .map((r) => ({
      ...r,
      absenceRate: r.total > 0 ? Math.round((r.absent / r.total) * 100) : 0,
      presenceRate: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0,
    }))
    .sort((a, b) => b.absent - a.absent || b.absenceRate - a.absenceRate)

  /** Moyennes par classe (/20) */
  const gradeAgg = new Map<string, { sum20: number; n: number; name: string; grade_level: string | null }>()

  for (const g of periodGrades ?? []) {
    const gv = g.grade_value as number
    const mx = g.max_grade as number
    const cid = (g as any).student?.class_id as string | undefined
    if (!cid || !mx || mx <= 0) continue
    if (!classMatchesNiveau(cid)) continue
    const c = classById.get(cid) as any
    if (!gradeAgg.has(cid)) {
      gradeAgg.set(cid, { sum20: 0, n: 0, name: c?.name || '—', grade_level: c?.grade_level ?? null })
    }
    const row = gradeAgg.get(cid)!
    row.sum20 += (gv / mx) * 20
    row.n++
  }

  const gradesRanking = Array.from(gradeAgg.entries())
    .map(([classId, v]) => ({
      classId,
      name: v.name,
      grade_level: v.grade_level,
      count: v.n,
      avg20: v.n > 0 ? v.sum20 / v.n : 0,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avg20 - a.avg20)

  const validGrades = (recentGrades ?? []).filter((g: any) => g.grade_value != null && g.max_grade != null)
  const avgGrade =
    validGrades.length > 0
      ? (
          validGrades.reduce((sum: number, g: any) => sum + (g.grade_value / g.max_grade) * 100, 0) /
          validGrades.length
        ).toFixed(1)
      : null

  const niveauOptions = [
    ...new Set([
      ...PRIMARY_GRADE_OPTIONS_TUNISIA,
      ...(classesFull ?? []).map((c: any) => c.grade_level).filter(Boolean),
    ]),
  ].sort() as string[]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble — classements par classe</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filtres</p>
        <form method="get" className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-4">
          <div>
            <label htmlFor="rep-days" className="block text-sm font-medium text-gray-700 mb-1">
              Période
            </label>
            <select
              id="rep-days"
              name="days"
              defaultValue={String(days)}
              className="border border-gray-400 rounded-lg px-3 py-2.5 text-sm min-w-[160px] focus:ring-2 focus:ring-indigo-500"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} derniers jours
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rep-niveau" className="block text-sm font-medium text-gray-700 mb-1">
              Niveau (classe)
            </label>
            <select
              id="rep-niveau"
              name="niveau"
              defaultValue={niveauFilter}
              className="border border-gray-400 rounded-lg px-3 py-2.5 text-sm min-w-[180px] focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tous les niveaux</option>
              {niveauOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Appliquer
          </button>
          {(niveauFilter || days !== 30) && (
            <Link
              href="/admin/reports"
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 text-center"
            >
              Réinitialiser
            </Link>
          )}
        </form>
        <p className="text-xs text-gray-500 mt-3">
          Données du <strong>{new Date(fromDate).toLocaleDateString('fr-FR')}</strong> au{' '}
          <strong>{new Date().toLocaleDateString('fr-FR')}</strong>
          {niveauFilter ? (
            <>
              {' '}
              · Niveau : <strong>{niveauFilter}</strong>
            </>
          ) : null}
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-indigo-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Utilisateurs</p>
          <p className="text-3xl font-bold text-gray-900">{totalUsers || 0}</p>
          <p className="text-xs text-gray-400 mt-1">
            {teachersCount || 0} enseignants · {parentsCount || 0} parents
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Élèves</p>
          <p className="text-3xl font-bold text-gray-900">{totalStudents || 0}</p>
          <p className="text-xs text-gray-400 mt-1">{studentsWithClass || 0} inscrits en classe</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Classes</p>
          <p className="text-3xl font-bold text-gray-900">{totalClasses || 0}</p>
          <p className="text-xs text-gray-400 mt-1">
            {(totalClasses || 0) > 0 ? Math.round((totalStudents || 0) / (totalClasses || 1)) : 0} élèves/classe env.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-emerald-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Taux présence ({days}j)</p>
          <p className="text-3xl font-bold text-gray-900">{overallRate !== null ? `${overallRate}%` : '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{totalAttendance} relevés (filtrés)</p>
        </div>
      </div>

      {/* Classements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b bg-red-50/40">
            <h2 className="font-semibold text-gray-900">Classes avec le plus d&apos;absences</h2>
            <p className="text-xs text-gray-500 mt-1">
              Tri par nombre d&apos;absences (statut « Absent »), sur la période filtrée.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Classe</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Niveau</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Absences</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Retards</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Taux abs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {absenceRanking.length > 0 ? (
                  absenceRanking.map((r, i) => (
                    <tr key={r.classId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link href={`/admin/classes/${r.classId}`} className="text-indigo-600 hover:underline">
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.grade_level || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">{r.absent}</td>
                      <td className="px-4 py-3 text-right text-amber-700">{r.late}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            r.absenceRate >= 25
                              ? 'bg-red-100 text-red-800'
                              : r.absenceRate >= 10
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {r.absenceRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Aucune donnée de présence sur cette période / filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b bg-emerald-50/40">
            <h2 className="font-semibold text-gray-900">Classes avec les meilleures notes</h2>
            <p className="text-xs text-gray-500 mt-1">
              Moyenne sur /20 (toutes notes de la période), classes triées de la plus haute à la plus basse.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Classe</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Niveau</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Nb notes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Moy. /20</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {gradesRanking.length > 0 ? (
                  gradesRanking.map((r, i) => (
                    <tr key={r.classId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link href={`/admin/classes/${r.classId}`} className="text-indigo-600 hover:underline">
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.grade_level || '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{r.count}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold ${
                            r.avg20 >= 14 ? 'text-emerald-600' : r.avg20 >= 10 ? 'text-amber-600' : 'text-red-600'
                          }`}
                        >
                          {r.avg20.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Aucune note sur cette période / filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Répartition des statuts ({days} jours)</h2>
          {totalAttendance > 0 ? (
            <div className="space-y-3">
              {[
                { key: 'present', label: 'Présent', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                { key: 'absent', label: 'Absent', color: 'bg-red-500', textColor: 'text-red-600' },
                { key: 'late', label: 'En retard', color: 'bg-amber-500', textColor: 'text-amber-600' },
                { key: 'excused', label: 'Excusé', color: 'bg-blue-500', textColor: 'text-blue-600' },
              ].map((item) => {
                const count = statusBreakdown[item.key as keyof typeof statusBreakdown]
                const pct = totalAttendance > 0 ? Math.round((count / totalAttendance) * 100) : 0
                return (
                  <div key={item.key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-medium ${item.textColor}`}>{item.label}</span>
                      <span className="text-sm text-gray-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-2 ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Aucune donnée de présence</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Élèves par classe</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {classesFull && classesFull.length > 0 ? (
              (() => {
                const list = niveauFilter
                  ? (classesFull as any[]).filter((cls) => (cls.grade_level || '') === niveauFilter)
                  : (classesFull as any[])
                const maxStudents = Math.max(...list.map((c: any) => c.students?.[0]?.count || 0), 1)
                return list.map((cls: any) => {
                  const count = cls.students?.[0]?.count || 0
                  const pct = Math.round((count / maxStudents) * 100)
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
              })()
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucune classe</p>
            )}
          </div>
        </div>
      </div>

      {/* Taux présence par classe (toutes avec données) */}
      {absenceRanking.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Taux de présence par classe ({days} jours)</h2>
            <Link href="/admin/attendance" className="text-xs text-indigo-600 hover:underline">
              Gérer les présences
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50">
                <tr>
                  {['Classe', 'Relevés', 'Présents', 'Absents', 'Taux présence'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...absenceRanking]
                  .sort((a, b) => b.presenceRate - a.presenceRate)
                  .map((c) => (
                    <tr key={c.classId} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">
                        <Link href={`/admin/classes/${c.classId}`} className="text-indigo-600 hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{c.total}</td>
                      <td className="px-5 py-3 text-sm text-emerald-600 font-medium">{c.present}</td>
                      <td className="px-5 py-3 text-sm text-red-500">{c.absent}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.presenceRate >= 80
                              ? 'bg-emerald-100 text-emerald-700'
                              : c.presenceRate >= 60
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {c.presenceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {validGrades.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Notes récentes (20 dernières)</h2>
            <span className="text-xs text-gray-400">Moyenne : {avgGrade ? `${avgGrade}%` : '—'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50">
                <tr>
                  {['Élève', 'Matière', 'Note', 'Type', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(recentGrades as any[])?.slice(0, 10).map((g: any) => {
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
        </div>
      )}
    </div>
  )
}
