import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClassesPage() {
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey(full_name),
      students(count)
    `)
    .order('name', { ascending: true })

  const totalStudents = classes?.reduce(
    (sum, c) => sum + ((c.students as any)?.[0]?.count || 0),
    0
  ) || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">Gestion des classes et des matières</p>
        </div>
        <Link href="/admin/classes/add" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
          + Ajouter une classe
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total classes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{classes?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Enseignants assignés</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {classes?.filter(c => c.teacher_id).length || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total élèves inscrits</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalStudents}</p>
        </div>
      </div>

      {classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {classes.map((cls: any) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{cls.name}</h3>
                    {cls.grade_level && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                        {cls.grade_level}
                      </span>
                    )}
                  </div>
                  {cls.academic_year && (
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{cls.academic_year}</span>
                  )}
                </div>

                {cls.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{cls.description}</p>
                )}

                <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{cls.teacher?.full_name || 'Enseignant non assigné'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{cls.students?.[0]?.count || 0} élève(s)</span>
                  </div>
                </div>

                <div className="flex gap-2 border-t pt-3">
                  <Link
                    href={`/admin/classes/${cls.id}`}
                    className="flex-1 text-center py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100"
                  >
                    Détails
                  </Link>
                  <Link
                    href={`/admin/classes/edit/${cls.id}`}
                    className="flex-1 text-center py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-3 text-sm font-medium text-gray-700">Aucune classe</h3>
          <p className="mt-1 text-sm text-gray-400">Commencez par créer une nouvelle classe</p>
          <Link href="/admin/classes/add" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            + Créer une classe
          </Link>
        </div>
      )}
    </div>
  )
}
