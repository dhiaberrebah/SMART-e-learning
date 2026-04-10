import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { getTeacherClasses } from '@/lib/teacher-classes'

export default async function TeacherSubjects({ searchParams }: { searchParams: Promise<{ class_id?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const classes = await getTeacherClasses(db, user!.id, 'id, name')

  let q = db
    .from('subjects')
    .select('id, name, description, class_id, class:classes(name)')
    .eq('teacher_id', user!.id)
    .order('name')

  if (sp.class_id) {
    q = q.eq('class_id', sp.class_id)
  }

  const { data: subjects } = await q

  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes matières</h1>
        <p className="text-gray-500 text-sm mt-1">
          Matières qui vous sont assignées par l&apos;administration. Vous ne pouvez pas les créer ni les supprimer ici.
        </p>
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
          Besoin d&apos;une nouvelle matière ? Contactez un administrateur.
        </p>
      </div>

      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <select
          name="class_id"
          defaultValue={sp.class_id ?? ''}
          className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">Toutes mes classes</option>
          {(classes as any[] ?? []).map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Filtrer
        </button>
        {sp.class_id ? (
          <Link
            href="/teacher/subjects"
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Réinitialiser
          </Link>
        ) : null}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(subjects ?? []).length > 0 ? (
          (subjects as any[]).map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <span className="text-purple-700 font-bold">{sub.name?.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{sub.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{sub.class?.name ?? '—'}</p>
                </div>
              </div>
              {sub.description ? (
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{sub.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 text-xs">
                <Link href={`/teacher/grades?subject_id=${sub.id}`} className="text-blue-600 hover:underline">
                  Voir les notes
                </Link>
                <span className="text-gray-300">·</span>
                <Link
                  href={sub.class_id ? `/teacher/content?class_id=${sub.class_id}` : '/teacher/content'}
                  className="text-blue-600 hover:underline"
                >
                  Cours & ressources
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-gray-600 font-medium">Aucune matière ne vous est assignée pour l&apos;instant.</p>
            <p className="text-sm text-gray-500 mt-2">
              L&apos;administrateur doit créer les matières et vous les attribuer pour chaque classe.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
