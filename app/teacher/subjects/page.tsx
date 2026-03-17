import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { redirect } from 'next/navigation'

async function deleteSubject(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  await db.from('subjects').delete().eq('id', id)
  redirect('/teacher/subjects')
}

export default async function TeacherSubjects({ searchParams }: { searchParams: Promise<{ class_id?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const { data: classes } = await db.from('classes').select('id, name').eq('teacher_id', user!.id).order('name')
  const classIds = (classes ?? []).map((c: any) => c.id)

  const targetIds = sp.class_id ? [sp.class_id] : classIds

  const { data: subjects } = targetIds.length > 0
    ? await db.from('subjects').select('id, name, description, class_id, class:classes(name)').in('class_id', targetIds).order('name')
    : Promise.resolve({ data: [] })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matières</h1>
          <p className="text-gray-500 text-sm mt-1">{(subjects ?? []).length} matière{(subjects ?? []).length !== 1 ? 's' : ''}</p>
        </div>
        <Link href={`/teacher/subjects/add${sp.class_id ? `?class_id=${sp.class_id}` : ''}`}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Nouvelle matière
        </Link>
      </div>

      {/* Filter */}
      <form method="GET" className="flex gap-3 mb-6">
        <select name="class_id" defaultValue={sp.class_id ?? ''}
          className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes les classes</option>
          {(classes as any[] ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
          Filtrer
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(subjects ?? []).length > 0 ? (
          (subjects as any[]).map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-700 font-bold">{sub.name?.charAt(0)}</span>
                </div>
                <form action={deleteSubject}>
                  <input type="hidden" name="id" value={sub.id} />
                  <button type="submit" className="text-gray-300 hover:text-red-500 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </form>
              </div>
              <h3 className="font-semibold text-gray-900">{sub.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{sub.class?.name ?? '—'}</p>
              {sub.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{sub.description}</p>}
              <div className="flex gap-2 mt-4">
                <Link href={`/teacher/grades?subject_id=${sub.id}`}
                  className="text-xs text-blue-600 hover:underline">Voir notes</Link>
                <span className="text-gray-300">·</span>
                <Link href={`/teacher/content?subject_id=${sub.id}`}
                  className="text-xs text-blue-600 hover:underline">Voir cours</Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-gray-500">Aucune matière trouvée.</p>
            <Link href="/teacher/subjects/add" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
              Créer une première matière
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
