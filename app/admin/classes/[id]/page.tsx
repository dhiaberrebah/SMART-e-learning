import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClassCurriculumSection from './ClassCurriculumSection'

const subjectSuccess: Record<string, string> = {
  subject_added: 'Matière créée.',
  subject_updated: 'Matière mise à jour.',
  subject_deleted: 'Matière supprimée.',
  curriculum_updated: 'Programme prévu mis à jour.',
  curriculum_preset_applied: 'Préréglage appliqué (les doublons ont été ignorés).',
}

const curriculumErrorLabels: Record<string, string> = {
  missing: 'Action impossible : informations manquantes.',
  duplicate: 'Cette matière figure déjà dans le programme prévu.',
  invalid_preset: 'Préréglage inconnu.',
}

export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; curriculum_error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: cls }, { data: students }, { data: subjects }, { data: attendance }, { data: curriculumItems }] =
    await Promise.all([
      supabase
        .from('classes')
        .select(`*, teacher:profiles!classes_teacher_id_fkey(full_name, email)`)
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('students')
        .select(`*, parent:profiles!students_parent_id_fkey(full_name)`)
        .eq('class_id', id)
        .order('full_name'),
      supabase
        .from('subjects')
        .select(`*, teacher:profiles!subjects_teacher_id_fkey(full_name)`)
        .eq('class_id', id)
        .order('name'),
      supabase
        .from('attendance')
        .select('date, status, student_id')
        .eq('class_id', id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false }),
      supabase
        .from('class_curriculum_items')
        .select('id, name, sort_order')
        .eq('class_id', id)
        .order('sort_order', { ascending: true }),
    ])

  if (!cls) redirect('/admin/classes')

  // Calculate attendance stats for last 7 days
  const presentCount = attendance?.filter(a => a.status === 'present').length || 0
  const totalCount = attendance?.length || 0
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null

  // Group attendance by date
  const attendanceByDate = attendance?.reduce((acc: Record<string, typeof attendance>, a) => {
    if (!acc[a.date]) acc[a.date] = []
    acc[a.date].push(a)
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
    <div className="p-6 max-w-7xl mx-auto">
      {sp.success && subjectSuccess[sp.success] && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">
          {subjectSuccess[sp.success]}
        </div>
      )}
      {sp.curriculum_error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {curriculumErrorLabels[sp.curriculum_error] ?? decodeURIComponent(sp.curriculum_error)}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/classes" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{(cls as any).name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {(cls as any).grade_level && <span className="mr-2">{(cls as any).grade_level}</span>}
              {(cls as any).academic_year && <span className="text-gray-400">{(cls as any).academic_year}</span>}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/classes/edit/${id}`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          Modifier
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Enseignant</p>
          <p className="text-sm font-semibold text-gray-900">{(cls as any).teacher?.full_name || '—'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Élèves</p>
          <p className="text-2xl font-bold text-indigo-600">{students?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Matières</p>
          <p className="text-2xl font-bold text-emerald-600">{subjects?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Présences (7j)</p>
          <p className="text-2xl font-bold text-amber-600">
            {attendanceRate !== null ? `${attendanceRate}%` : '—'}
          </p>
        </div>
      </div>

      <ClassCurriculumSection
        classId={id}
        items={(curriculumItems ?? []) as { id: string; name: string; sort_order: number }[]}
        subjectNames={(subjects ?? []).map((s: { name: string }) => s.name)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students list */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Élèves ({students?.length || 0})</h2>
            <Link href="/admin/students/add" className="text-xs text-indigo-600 hover:underline">+ Ajouter</Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {students && students.length > 0 ? (
              students.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-700 text-xs font-bold">{s.full_name?.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.full_name}</p>
                    <p className="text-xs text-gray-400">{s.parent?.full_name || 'Pas de parent'}</p>
                  </div>
                  <Link href={`/admin/students/edit/${s.id}`} className="text-xs text-indigo-500 hover:underline">
                    Modifier
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Aucun élève dans cette classe</p>
            )}
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Matières ({subjects?.length || 0})</h2>
            <Link
              href={`/admin/subjects/add?class_id=${id}`}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              + Ajouter une matière
            </Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {subjects && subjects.length > 0 ? (
              subjects.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                    <p className="text-xs text-gray-400">{sub.teacher?.full_name || 'Pas d\'enseignant'}</p>
                  </div>
                  <Link
                    href={`/admin/subjects/edit/${sub.id}`}
                    className="text-xs text-indigo-600 hover:underline shrink-0"
                  >
                    Modifier
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Aucune matière — ajoutez-en depuis le bouton ci-dessus</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent attendance */}
      {Object.keys(attendanceByDate).length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Présences — 7 derniers jours</h2>
            <Link href={`/admin/attendance?class_id=${id}`} className="text-xs text-indigo-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Présents</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Absents</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.entries(attendanceByDate)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 7)
                  .map(([date, records]) => {
                    const present = records.filter(r => r.status === 'present').length
                    const total = records.length
                    const rate = total > 0 ? Math.round((present / total) * 100) : 0
                    return (
                      <tr key={date} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-5 py-3 text-sm text-emerald-600 font-medium">{present}</td>
                        <td className="px-5 py-3 text-sm text-red-500">{total - present}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rate >= 80 ? 'bg-emerald-100 text-emerald-700' : rate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {rate}%
                          </span>
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
