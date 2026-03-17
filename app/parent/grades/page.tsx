import { createClient } from '@/lib/supabase/server'

export default async function ParentGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ child_id?: string; subject?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get parent's children
  const { data: children } = await supabase
    .from('students')
    .select('id, full_name, class_id')
    .eq('parent_id', user!.id)
    .order('full_name')

  const childIds = children?.map(c => c.id) || []
  const selectedChildId = sp.child_id || ''
  const selectedSubject = sp.subject || ''

  // Fetch grades
  let query = supabase
    .from('grades')
    .select(`
      *,
      subject:subjects(name),
      student:students(full_name)
    `)
    .in('student_id', childIds.length > 0 ? childIds : ['none'])
    .order('date', { ascending: false })

  if (selectedChildId) query = query.eq('student_id', selectedChildId)

  const { data: grades } = await query

  // Filter by subject if selected
  const filteredGrades = selectedSubject
    ? grades?.filter((g: any) => g.subject?.name === selectedSubject)
    : grades

  // Extract unique subjects
  const uniqueSubjects = [...new Set(grades?.map((g: any) => g.subject?.name).filter(Boolean))]

  // Stats
  const validGrades = filteredGrades?.filter(g => g.grade_value !== null && g.max_grade > 0) || []
  const avgGrade = validGrades.length > 0
    ? (validGrades.reduce((s, g) => s + (g.grade_value / g.max_grade) * 100, 0) / validGrades.length)
    : null

  const highestGrade = validGrades.length > 0
    ? validGrades.reduce((best, g) => ((g.grade_value / g.max_grade) > (best.grade_value / best.max_grade) ? g : best))
    : null

  const lowestGrade = validGrades.length > 0
    ? validGrades.reduce((worst, g) => ((g.grade_value / g.max_grade) < (worst.grade_value / worst.max_grade) ? g : worst))
    : null

  // Group by subject for overview
  const bySubject = (filteredGrades || []).reduce((acc: Record<string, any[]>, g: any) => {
    const sub = g.subject?.name || 'Autre'
    if (!acc[sub]) acc[sub] = []
    acc[sub].push(g)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
        <p className="text-gray-500 mt-1">Résultats scolaires de vos enfants</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <form method="GET" className="flex flex-wrap gap-3">
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
          <select
            name="subject"
            defaultValue={selectedSubject}
            className="px-3 py-2 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Toutes les matières</option>
            {uniqueSubjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            Filtrer
          </button>
        </form>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${avgGrade !== null && avgGrade >= 70 ? 'text-emerald-600' : avgGrade !== null && avgGrade >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {avgGrade !== null ? `${Math.round(avgGrade)}%` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Moyenne générale</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{validGrades.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Notes au total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {highestGrade ? `${highestGrade.grade_value}/${highestGrade.max_grade}` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Meilleure note</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {lowestGrade ? `${lowestGrade.grade_value}/${lowestGrade.max_grade}` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Note la plus basse</p>
        </div>
      </div>

      {validGrades.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grades by subject */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Par matière</h2>
            {Object.entries(bySubject).map(([subject, subGrades]: [string, any[]]) => {
              const valid = subGrades.filter(g => g.max_grade > 0)
              const avg = valid.length > 0
                ? Math.round(valid.reduce((s, g) => s + (g.grade_value / g.max_grade) * 100, 0) / valid.length)
                : null
              return (
                <div key={subject} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800">{subject}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${avg !== null && avg >= 70 ? 'bg-emerald-100 text-emerald-700' : avg !== null && avg >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {avg !== null ? `${avg}%` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${avg !== null && avg >= 70 ? 'bg-emerald-500' : avg !== null && avg >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${avg || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{subGrades.length} note(s)</p>
                </div>
              )
            })}
          </div>

          {/* Full grades list */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Toutes les notes ({validGrades.length})</p>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredGrades?.map((g: any, i) => {
                const pct = g.max_grade > 0 ? Math.round((g.grade_value / g.max_grade) * 100) : 0
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${pct >= 70 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {g.grade_value}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{g.subject?.name || '—'}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {!selectedChildId && <span>{g.student?.full_name}</span>}
                        {g.grade_type && <span>· {g.grade_type}</span>}
                        {g.date && <span>· {new Date(g.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>}
                      </div>
                      {g.notes && <p className="text-xs text-gray-400 italic mt-0.5">{g.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">{g.grade_value}/{g.max_grade}</p>
                      <p className={`text-xs font-semibold ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {pct}%
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-sm font-medium text-gray-700">Aucune note disponible</h3>
          <p className="text-xs text-gray-400 mt-1">Les notes apparaîtront ici une fois saisies par les enseignants</p>
        </div>
      )}
    </div>
  )
}
