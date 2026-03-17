import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { redirect } from 'next/navigation'

async function deleteContent(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  await db.from('pedagogical_contents').delete().eq('id', id)
  redirect('/teacher/content')
}

export default async function TeacherContent({ searchParams }: { searchParams: Promise<{ class_id?: string; subject_id?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const { data: classes } = await db.from('classes').select('id, name').eq('teacher_id', user!.id).order('name')
  const classIds = (classes ?? []).map((c: any) => c.id)

  const { data: subjects } = classIds.length > 0
    ? await db.from('subjects').select('id, name, class_id').in('class_id', classIds).order('name')
    : Promise.resolve({ data: [] })

  let query = db.from('pedagogical_contents')
    .select('id, title, description, file_path, mime_type, size_bytes, created_at, class:classes(name), subject:subjects(name)')
    .eq('teacher_id', user!.id)

  if (sp.class_id) query = query.eq('class_id', sp.class_id)
  if (sp.subject_id) query = query.eq('subject_id', sp.subject_id)

  const { data: contents } = await query.order('created_at', { ascending: false })

  const filteredSubjects = sp.class_id ? (subjects ?? []).filter((s: any) => s.class_id === sp.class_id) : (subjects ?? [])

  const formatSize = (bytes: number | null) => {
    if (!bytes) return null
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const getMimeIcon = (mime: string | null) => {
    if (!mime) return '📄'
    if (mime.startsWith('image/')) return '🖼️'
    if (mime.includes('pdf')) return '📕'
    if (mime.includes('video')) return '🎬'
    if (mime.includes('audio')) return '🎵'
    if (mime.includes('word') || mime.includes('document')) return '📝'
    if (mime.includes('sheet') || mime.includes('excel')) return '📊'
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊'
    return '📄'
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cours & Ressources</h1>
          <p className="text-gray-500 text-sm mt-1">{(contents ?? []).length} ressource{(contents ?? []).length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/teacher/content/add" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Ajouter une ressource
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <select name="class_id" defaultValue={sp.class_id ?? ''}
          className="border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes les classes</option>
          {(classes as any[] ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="subject_id" defaultValue={sp.subject_id ?? ''}
          className="border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes les matières</option>
          {(filteredSubjects as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Filtrer
        </button>
        {(sp.class_id || sp.subject_id) && (
          <Link href="/teacher/content" className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Réinitialiser
          </Link>
        )}
      </form>

      {(contents ?? []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(contents as any[]).map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{getMimeIcon(c.mime_type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {c.class?.name && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c.class.name}</span>
                    )}
                    {c.subject?.name && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{c.subject.name}</span>
                    )}
                  </div>
                  {c.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {c.file_path && <a href={c.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Télécharger</a>}
                      {c.size_bytes && <span>{formatSize(c.size_bytes)}</span>}
                      <span>{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <form action={deleteContent}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition-colors">Supprimer</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-gray-500">Aucune ressource pédagogique publiée.</p>
          <Link href="/teacher/content/add" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Ajouter ma première ressource
          </Link>
        </div>
      )}
    </div>
  )
}
