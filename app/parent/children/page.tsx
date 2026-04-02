import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ChildrenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: children } = await supabase
    .from('students')
    .select(`
      *,
      class:classes(id, name, grade_level, academic_year, teacher:profiles!classes_teacher_id_fkey(full_name, email))
    `)
    .eq('parent_id', user!.id)
    .order('full_name')

  const childIds = children?.map(c => c.id) || []

  // Attendance stats per child (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: attendance } = await supabase
    .from('attendance')
    .select('student_id, status')
    .in('student_id', childIds.length > 0 ? childIds : ['none'])
    .gte('date', thirtyDaysAgo)

  // Grades count per child
  const { data: grades } = await supabase
    .from('grades')
    .select('student_id, grade_value, max_grade')
    .in('student_id', childIds.length > 0 ? childIds : ['none'])

  const getStats = (childId: string) => {
    const records = attendance?.filter(a => a.student_id === childId) || []
    const present = records.filter(a => a.status === 'present').length
    const total = records.length
    const childGrades = grades?.filter(g => g.student_id === childId) || []
    const validGrades = childGrades.filter(g => g.grade_value !== null && g.max_grade > 0)
    const avgGrade = validGrades.length > 0
      ? (validGrades.reduce((s, g) => s + (g.grade_value / g.max_grade) * 100, 0) / validGrades.length)
      : null
    return {
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : null,
      totalAttendance: total,
      gradeCount: childGrades.length,
      avgGrade: avgGrade !== null ? Math.round(avgGrade) : null,
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes enfants</h1>
        <p className="text-gray-500 mt-1">Suivez les informations de vos enfants scolarisés</p>
      </div>

      {children && children.length > 0 ? (
        <div className="space-y-5">
          {children.map((child: any) => {
            const stats = getStats(child.id)
            return (
              <div key={child.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-700 text-2xl font-bold">
                          {child.full_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{child.full_name}</h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          {child.student_number && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                              N° {child.student_number}
                            </span>
                          )}
                          {child.date_of_birth && (
                            <span>
                              Né(e) le {new Date(child.date_of_birth).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/parent/children/${child.id}`}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-shrink-0"
                    >
                      Voir le détail
                    </Link>
                  </div>

                  {/* Class info */}
                  <div className="mt-5 p-4 bg-gray-50 rounded-xl">
                    {child.class ? (
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Classe</p>
                          <p className="font-semibold text-gray-800">{child.class.name}</p>
                        </div>
                        {child.class.grade_level && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Niveau</p>
                            <p className="font-semibold text-gray-800">{child.class.grade_level}</p>
                          </div>
                        )}
                        {child.class.academic_year && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Année scolaire</p>
                            <p className="font-semibold text-gray-800">{child.class.academic_year}</p>
                          </div>
                        )}
                        {child.class.teacher && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Enseignant</p>
                            <p className="font-semibold text-gray-800">{child.class.teacher.full_name}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Aucune classe assignée</p>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-emerald-50 rounded-xl">
                      <p className="text-xl font-bold text-emerald-700">
                        {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '—'}
                      </p>
                      <p className="text-xs text-emerald-600 mt-0.5">Présences (30j)</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <p className="text-xl font-bold text-blue-700">{stats.totalAttendance}</p>
                      <p className="text-xs text-blue-600 mt-0.5">Jours enregistrés</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl">
                      <p className="text-xl font-bold text-purple-700">{stats.gradeCount}</p>
                      <p className="text-xs text-purple-600 mt-0.5">Notes reçues</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-xl">
                      <p className="text-xl font-bold text-amber-700">
                        {stats.avgGrade !== null ? `${stats.avgGrade}%` : '—'}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">Moyenne générale</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">👨‍👧</div>
          <h3 className="text-sm font-semibold text-gray-700">Aucun enfant associé</h3>
          <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
            L&apos;école enregistre vos enfants avec votre CIN : ils s&apos;affichent ici automatiquement. Vérifiez votre CIN dans Mon profil s&apos;il ne correspond pas à celui donné à l&apos;administration.
          </p>
        </div>
      )}
    </div>
  )
}
