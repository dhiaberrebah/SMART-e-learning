import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { getTeacherClasses } from '@/lib/teacher-classes'

export default async function TeacherClasses() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const classes = await getTeacherClasses(db, user!.id)

  const classIds = (classes ?? []).map((c: any) => c.id)
  const [{ data: students }, { data: subjects }] = await Promise.all([
    classIds.length > 0
      ? db.from('students').select('id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? db
          .from('subjects')
          .select('id, name, class_id')
          .in('class_id', classIds)
          .eq('teacher_id', user!.id)
      : Promise.resolve({ data: [] }),
  ])

  const studentCount = (id: string) => (students ?? []).filter((s: any) => s.class_id === id).length
  const subjectCount = (id: string) => (subjects ?? []).filter((s: any) => s.class_id === id).length

  return (
    <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes classes</h1>
        <p className="text-gray-500 text-sm mt-1">{(classes ?? []).length} classe{(classes ?? []).length !== 1 ? 's' : ''} assignée{(classes ?? []).length !== 1 ? 's' : ''}</p>
      </div>

      {(classes ?? []).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">🏫</div>
          <p className="text-gray-500">Aucune classe ne vous est assignée pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(classes as any[]).map((cls) => (
            <Link key={cls.id} href={`/teacher/classes/${cls.id}`}
              className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-lg">{cls.name?.charAt(0)}</span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {cls.academic_year ?? '—'}
                </span>
              </div>
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{cls.name}</h2>
              {cls.grade_level && <p className="text-sm text-gray-500 mt-0.5">{cls.grade_level}</p>}
              {cls.description && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{cls.description}</p>}
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{studentCount(cls.id)}</p>
                  <p className="text-xs text-gray-400">élèves</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{subjectCount(cls.id)}</p>
                  <p className="text-xs text-gray-400">matières</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
