import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { getTeacherClasses } from '@/lib/teacher-classes'
import { updatePedagogicalContent } from '@/lib/actions/update-pedagogical-content'
import { contentKindLabel, resolveContentKind, type ContentKind } from '@/lib/pedagogical-content-kind'

const KINDS: ContentKind[] = ['pdf', 'video', 'image', 'other']

export default async function EditTeacherContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const [{ data: row }, classes] = await Promise.all([
    db
      .from('pedagogical_contents')
      .select('id, title, description, file_path, mime_type, content_kind, class_id, teacher_id')
      .eq('id', id)
      .maybeSingle(),
    getTeacherClasses(db, user.id, 'id, name'),
  ])

  if (!row || row.teacher_id !== user.id) {
    redirect('/teacher/content')
  }

  const resolved = resolveContentKind({
    content_kind: row.content_kind,
    mime_type: row.mime_type,
    file_path: row.file_path,
  })

  return (
    <div className="p-6 max-w-2xl mx-auto h-full overflow-y-auto">
      <div className="mb-6">
        <Link href="/teacher/content" className="text-sm text-blue-600 hover:underline">
          ← Cours & Ressources
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Modifier la ressource</h1>
        <p className="text-gray-500 text-sm mt-1">
          Infos métadonnées (le fichier téléversé ne change pas depuis cette page).
        </p>
      </div>

      {sp.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form action={updatePedagogicalContent} className="space-y-5">
          <input type="hidden" name="id" value={row.id} />

          <div>
            <label htmlFor="ed-title" className="block text-sm font-medium text-gray-700 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              id="ed-title"
              name="title"
              type="text"
              required
              defaultValue={row.title ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ed-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="ed-desc"
              name="description"
              rows={4}
              defaultValue={row.description ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y min-h-[100px]"
            />
          </div>

          <div>
            <label htmlFor="ed-class" className="block text-sm font-medium text-gray-700 mb-1">
              Classe
            </label>
            <select
              id="ed-class"
              name="class_id"
              defaultValue={row.class_id ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Toutes les classes</option>
              {(classes ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ed-kind" className="block text-sm font-medium text-gray-700 mb-1">
              Type (affichage & filtres)
            </label>
            <select
              id="ed-kind"
              name="content_kind"
              defaultValue={resolved}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {contentKindLabel(k)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-600">
            Fichier : {row.file_path ? 'lien défini — remplacez depuis « Ajouter » si besoin.' : 'aucun fichier'}
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm"
            >
              Enregistrer
            </button>
            <Link
              href="/teacher/content"
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm inline-flex items-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
