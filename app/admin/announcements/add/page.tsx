import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function handleCreate(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      location: (formData.get('location') as string) || null,
      start_at: formData.get('start_at') as string,
      end_at: (formData.get('end_at') as string) || null,
      created_by: user?.id,
    })
    .select()
    .maybeSingle()

  if (error || !event) {
    redirect('/admin/announcements/add?error=' + encodeURIComponent(error?.message || 'Erreur'))
  }

  // Add class targets
  const classIds = formData.getAll('class_ids[]') as string[]
  if (classIds.length > 0) {
    await supabase.from('event_targets').insert(
      classIds.map(classId => ({
        event_id: event.id,
        target_type: 'class',
        class_id: classId,
      }))
    )
  }

  redirect('/admin/announcements?success=created')
}

export default async function AddAnnouncementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade_level')
    .order('name')

  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/announcements" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvel événement</h1>
          <p className="text-gray-500 text-sm mt-0.5">Créer un événement ou une annonce</p>
        </div>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form action={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="Ex : Réunion parents-enseignants"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Détails de l'événement..."
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu</label>
            <input
              type="text"
              name="location"
              placeholder="Ex : Salle A, gymnase..."
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Début <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="start_at"
                required
                defaultValue={localNow}
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fin</label>
              <input
                type="datetime-local"
                name="end_at"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Classes concernées
            </label>
            <div className="border border-gray-400 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {classes && classes.length > 0 ? (
                classes.map(c => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="class_ids[]"
                      value={c.id}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      {c.name}{c.grade_level ? ` (${c.grade_level})` : ''}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-400">Aucune classe disponible</p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Laissez vide pour un événement général</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
              Créer l&apos;événement
            </button>
            <Link href="/admin/announcements" className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
