import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

async function markRead(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  if (!id) return
  const db = createServiceClient()
  await db.from('contact_messages').update({ is_read: true }).eq('id', id)
  revalidatePath('/admin/contact-messages')
}

export default async function AdminContactMessagesPage() {
  const db = createServiceClient()
  const { data: rows, error } = await db
    .from('contact_messages')
    .select('id, full_name, email, phone, subject, message, is_read, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Messages de contact</h1>
        <p className="mt-4 text-red-600 text-sm">
          Impossible de charger les messages. Vérifiez la migration <code className="bg-gray-100 px-1 rounded">012_contact_messages</code> et la clé service Supabase.
        </p>
      </div>
    )
  }

  const list = rows ?? []
  const unread = list.filter((r) => !r.is_read).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages de contact</h1>
          <p className="text-sm text-gray-500 mt-1">
            Demandes envoyées depuis le formulaire de la page d&apos;accueil.
          </p>
        </div>
        {unread > 0 && (
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1">
            {unread} non lu{unread > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-500 text-sm">
          Aucun message pour le moment.
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((m) => (
            <li
              key={m.id}
              className={`rounded-xl border shadow-sm overflow-hidden ${
                m.is_read ? 'bg-white border-gray-100' : 'bg-indigo-50/40 border-indigo-200/60'
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{m.full_name}</p>
                  <p className="text-sm text-indigo-600">
                    <a href={`mailto:${m.email}`} className="hover:underline">
                      {m.email}
                    </a>
                    {m.phone ? (
                      <span className="text-gray-500">
                        {' '}
                        · <a href={`tel:${m.phone}`}>{m.phone}</a>
                      </span>
                    ) : null}
                  </p>
                  {m.subject ? <p className="text-sm font-medium text-gray-700 mt-1">Sujet : {m.subject}</p> : null}
                </div>
                <div className="text-right shrink-0">
                  <time className="text-xs text-gray-400 block" dateTime={m.created_at}>
                    {new Date(m.created_at).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </time>
                  {!m.is_read && (
                    <form action={markRead} className="mt-2">
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Marquer comme lu
                      </button>
                    </form>
                  )}
                </div>
              </div>
              <div className="px-5 py-4 text-sm text-gray-700 whitespace-pre-wrap">{m.message}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
