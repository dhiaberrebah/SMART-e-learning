import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function handleDelete(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const eventId = formData.get('event_id') as string
  await supabase.from('event_targets').delete().eq('event_id', eventId)
  await supabase.from('events').delete().eq('id', eventId)
  const { redirect } = await import('next/navigation')
  redirect('/admin/announcements?success=deleted')
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      creator:profiles!events_created_by_fkey(full_name),
      targets:event_targets(
        target_type,
        class:classes(name),
        group:class_groups(name)
      )
    `)
    .order('start_at', { ascending: false })

  const upcoming = events?.filter(e => new Date(e.start_at) >= new Date()) || []
  const past = events?.filter(e => new Date(e.start_at) < new Date()) || []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Événements & Annonces</h1>
          <p className="text-gray-500 mt-1">Gérer les événements scolaires</p>
        </div>
        <Link
          href="/admin/announcements/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          + Nouvel événement
        </Link>
      </div>

      {sp.success === 'deleted' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Événement supprimé
        </div>
      )}
      {sp.success === 'created' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Événement créé avec succès
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total événements</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{events?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">À venir</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{upcoming.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Passés</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{past.length}</p>
        </div>
      </div>

      {events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event: any) => {
            const isPast = new Date(event.start_at) < new Date()
            const targets = event.targets || []
            return (
              <div key={event.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${isPast ? 'border-gray-200' : 'border-indigo-500'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                      {isPast && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Passé</span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(event.start_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        {event.end_at && ` → ${new Date(event.end_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {event.location}
                        </span>
                      )}
                      {event.creator && (
                        <span>Par {event.creator.full_name}</span>
                      )}
                    </div>
                    {targets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {targets.map((t: any, i: number) => (
                          <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                            {t.class?.name || t.group?.name || t.target_type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <form action={handleDelete}>
                    <input type="hidden" name="event_id" value={event.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-3 text-sm font-medium text-gray-700">Aucun événement</h3>
          <p className="mt-1 text-sm text-gray-400">Créez votre premier événement scolaire</p>
          <Link href="/admin/announcements/add" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            + Nouvel événement
          </Link>
        </div>
      )}
    </div>
  )
}
