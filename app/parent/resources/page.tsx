import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

const getMimeLabel = (mime: string | null) => {
  if (!mime) return 'Fichier'
  if (mime.startsWith('image/')) return 'Image'
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('video')) return 'Vidéo'
  if (mime.includes('audio')) return 'Audio'
  if (mime.includes('word') || mime.includes('document')) return 'Document'
  if (mime.includes('sheet') || mime.includes('excel')) return 'Tableur'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'Présentation'
  return 'Fichier'
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default async function ParentResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; type?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  // Get parent's children to know which classes to show
  const { data: children } = await db
    .from('students')
    .select('id, full_name, class_id, class:classes(id, name)')
    .eq('parent_id', user!.id)

  const classIds = (children ?? []).map((c: any) => c.class_id).filter(Boolean)

  // Fetch all content for those classes (or all if no children linked)
  let query = db
    .from('pedagogical_contents')
    .select('id, title, description, file_path, mime_type, size_bytes, created_at, class_id, class:classes(name), teacher:profiles!teacher_id(full_name)')
    .order('created_at', { ascending: false })

  if (classIds.length > 0) {
    if (sp.class_id) {
      query = query.eq('class_id', sp.class_id) as any
    } else {
      query = query.in('class_id', classIds) as any
    }
  }

  const { data: contents } = await query

  // Build unique classes list for filter
  const allClasses = (children ?? [])
    .map((c: any) => ({ id: c.class_id, name: c.class?.name }))
    .filter((c: any) => c.id && c.name)

  // Group by class for display
  const grouped: Record<string, { className: string; items: any[] }> = {}
  for (const item of contents ?? []) {
    const key = item.class_id ?? 'none'
    if (!grouped[key]) grouped[key] = { className: item.class?.name ?? 'Classe inconnue', items: [] }
    grouped[key].items.push(item)
  }

  const totalCount = (contents ?? []).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cours & Ressources</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ressources pédagogiques publiées par les enseignants de vos enfants
        </p>
      </div>

      {/* No children warning */}
      {(children ?? []).length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
          <span className="text-lg">⚠️</span>
          <span>
            Aucun enfant lié : assurez-vous que votre CIN sur Mon profil correspond à celui de l&apos;école ; les ressources des classes de vos enfants apparaîtront ici automatiquement.
          </span>
        </div>
      )}

      {/* Stats + filters */}
      {totalCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-sm text-gray-500">{totalCount} ressource{totalCount !== 1 ? 's' : ''}</span>
          {allClasses.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <a href="/parent/resources"
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!sp.class_id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Toutes les classes
              </a>
              {allClasses.map((c: any) => (
                <a key={c.id} href={`/parent/resources?class_id=${c.id}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sp.class_id === c.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {c.name}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {totalCount === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-gray-600 font-medium">Aucune ressource disponible pour le moment.</p>
          <p className="text-gray-400 text-sm mt-1">Les cours et documents publiés par les enseignants apparaîtront ici.</p>
        </div>
      ) : sp.class_id ? (
        /* Single class flat list */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(contents ?? []).map((c: any) => (
            <ResourceCard key={c.id} item={c} />
          ))}
        </div>
      ) : (
        /* Grouped by class */
        <div className="space-y-8">
          {Object.entries(grouped).map(([classId, group]) => (
            <div key={classId}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-5 bg-emerald-500 rounded-full" />
                <h2 className="font-semibold text-gray-800">{group.className}</h2>
                <span className="text-xs text-gray-400">{group.items.length} ressource{group.items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((item: any) => (
                  <ResourceCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ResourceCard({ item }: { item: any }) {
  const icon = getMimeIcon(item.mime_type)
  const label = getMimeLabel(item.mime_type)
  const size = formatSize(item.size_bytes)
  const isExternal = item.file_path?.startsWith('http')
  const isLocal = item.file_path && !isExternal

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-2xl">
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{label}</span>
            {item.teacher?.full_name && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {item.teacher.full_name}
              </span>
            )}
            {size && (
              <span className="text-xs text-gray-400">{size}</span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>

            {item.file_path ? (
              <a
                href={item.file_path}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                download={isLocal ? true : undefined}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isExternal ? 'Ouvrir' : 'Télécharger'}
              </a>
            ) : (
              <span className="text-xs text-gray-300 italic">Pas de fichier</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
