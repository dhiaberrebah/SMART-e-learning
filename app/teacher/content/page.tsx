import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTeacherClasses } from '@/lib/teacher-classes'
import { resolveContentKind } from '@/lib/pedagogical-content-kind'
import {
  aggregateStatsByContent,
  countWeekViews,
  totalDownloads,
  type RawEventRow,
} from '@/lib/teacher-pedagogical-stats'
import { TeacherContentExplorer, type TeacherContentItem } from '@/components/teacher/TeacherContentExplorer'

async function deleteContent(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  await db.from('pedagogical_contents').delete().eq('id', id)
  redirect('/teacher/content')
}

const SORT_IDS = [
  'created_desc',
  'created_asc',
  'title_asc',
  'title_desc',
  'size_desc',
  'size_asc',
  'views_desc',
  'views_asc',
] as const
type SortId = (typeof SORT_IDS)[number]

function cmpStr(a: string, b: string) {
  return a.localeCompare(b, 'fr', { sensitivity: 'base' })
}

export default async function TeacherContent({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; q?: string; type?: string; sort?: string; updated?: string; error?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const db = createServiceClient()

  const classes = await getTeacherClasses(db, user!.id, 'id, name')

  const { data: rawRows } = await db
    .from('pedagogical_contents')
    .select(
      `
      id, title, description, file_path, mime_type, size_bytes,
      created_at, content_kind, teacher_id, class_id,
      class:classes(name)
    `
    )
    .eq('teacher_id', user!.id)

  const rows = rawRows ?? []
  const ids = rows.map((r: { id: string }) => r.id)

  let events: RawEventRow[] = []
  if (ids.length > 0) {
    const { data: rawEvents } = await db
      .from('pedagogical_content_events')
      .select('pedagogical_content_id, event_kind, created_at')
      .in('pedagogical_content_id', ids)
    events = ((rawEvents ?? []) as RawEventRow[]).filter(
      (e) => e.event_kind === 'view' || e.event_kind === 'download'
    )
  }

  const statsById = aggregateStatsByContent(events, ids)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const dashboardWeekViews = countWeekViews(events, weekAgo)
  const dashboardTotalDownloads = totalDownloads(events)
  const dashboardTotalResources = rows.length

  const qNorm = (sp.q ?? '').trim().toLowerCase()
  const typeFilter = ((sp.type ?? '').trim() || 'all').toLowerCase()
  const classFilter = sp.class_id?.trim() || ''
  const sortRaw = (sp.sort ?? 'created_desc').trim()
  const sort: SortId = SORT_IDS.includes(sortRaw as SortId) ? (sortRaw as SortId) : 'created_desc'

  const classIdByContentId = new Map<string, string | null>()
  for (const r of rows as { id: string; class_id?: string | null }[]) {
    classIdByContentId.set(r.id, r.class_id ?? null)
  }

  const itemsBase: TeacherContentItem[] = rows.map((c: Record<string, unknown>) => ({
    id: c.id as string,
    title: c.title as string,
    description: (c.description as string | null) ?? null,
    file_path: (c.file_path as string | null) ?? null,
    mime_type: (c.mime_type as string | null) ?? null,
    size_bytes: (c.size_bytes as number | null) ?? null,
    created_at: c.created_at as string,
    content_kind: (c.content_kind as string | null) ?? null,
    class: (c.class as { name: string } | null) ?? null,
    kind: resolveContentKind({
      content_kind: c.content_kind as string | null,
      mime_type: c.mime_type as string | null,
      file_path: c.file_path as string | null,
    }),
    views: statsById[(c.id as string) ?? '']?.views ?? 0,
    downloads: statsById[(c.id as string) ?? '']?.downloads ?? 0,
  }))

  const filtered = itemsBase.filter((c) => {
    if (classFilter) {
      const cid = classIdByContentId.get(c.id)
      if (!cid || cid !== classFilter) return false
    }
    if (typeFilter !== 'all' && typeFilter !== '') {
      if (typeFilter === 'pdf' && c.kind !== 'pdf') return false
      if (typeFilter === 'video' && c.kind !== 'video') return false
      if (typeFilter === 'image' && c.kind !== 'image') return false
    }
    if (qNorm) {
      const t = `${c.title} ${c.description ?? ''}`.toLowerCase()
      if (!t.includes(qNorm)) return false
    }
    return true
  })

  const cmpSize = (a: TeacherContentItem, b: TeacherContentItem) => {
    const sa = a.size_bytes ?? -1
    const sb = b.size_bytes ?? -1
    return sa - sb
  }

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'created_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'created_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'title_asc':
        return cmpStr(a.title, b.title)
      case 'title_desc':
        return cmpStr(b.title, a.title)
      case 'size_asc':
        return cmpSize(a, b)
      case 'size_desc':
        return cmpSize(b, a)
      case 'views_asc':
        return a.views - b.views
      case 'views_desc':
        return b.views - a.views
      default:
        return 0
    }
  })

  const shownEmpty = sorted.length === 0 && dashboardTotalResources > 0

  const hasActiveFilters =
    !!classFilter || !!qNorm || !!(sp.type && sp.type.trim()) || sort !== 'created_desc'

  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto">
      {sp.updated === '1' && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Modifications enregistrées.
        </div>
      )}
      {sp.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cours & Ressources</h1>
          <p className="text-gray-500 text-sm mt-1">
            {sorted.length === dashboardTotalResources
              ? `${dashboardTotalResources} ressource${dashboardTotalResources !== 1 ? 's' : ''}`
              : `${sorted.length} sur ${dashboardTotalResources} affichées`}
          </p>
        </div>
        <Link
          href="/teacher/content/add"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          + Ajouter une ressource
        </Link>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total ressources</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardTotalResources}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Téléchargements (total)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardTotalDownloads}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vues (7 derniers jours)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardWeekViews}</p>
        </div>
      </section>

      <form method="GET" className="space-y-3 mb-6">
        <div className="flex flex-col xl:flex-row flex-wrap gap-3">
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Rechercher (titre, description)…"
            className="min-w-[200px] flex-1 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
          <select
            name="class_id"
            defaultValue={classFilter}
            className="border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          >
            <option value="">Toutes les classes</option>
            {(classes as { id: string; name: string }[] ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={(sp.type ?? '').trim()}
            className="border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 min-w-[160px]"
          >
            <option value="">Tous les types</option>
            <option value="pdf">PDF</option>
            <option value="video">Vidéo</option>
            <option value="image">Image</option>
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 min-w-[220px]"
          >
            <option value="created_desc">Trier · Date (récent)</option>
            <option value="created_asc">Trier · Date (ancien)</option>
            <option value="title_asc">Trier · Nom (A→Z)</option>
            <option value="title_desc">Trier · Nom (Z→A)</option>
            <option value="size_desc">Trier · Taille (↓)</option>
            <option value="size_asc">Trier · Taille (↑)</option>
            <option value="views_desc">Trier · Vues (↓)</option>
            <option value="views_asc">Trier · Vues (↑)</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Appliquer
          </button>
          {hasActiveFilters && (
            <Link
              href="/teacher/content"
              className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {sorted.length > 0 ? (
        <TeacherContentExplorer items={sorted} deleteAction={deleteContent} />
      ) : shownEmpty ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-6 text-sm text-amber-900">
          Aucun résultat pour ces filtres.{' '}
          <Link href="/teacher/content" className="font-medium underline">
            Réinitialiser
          </Link>
          .
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
