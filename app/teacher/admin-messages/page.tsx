import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const TARGET_LABEL: Record<string, string> = {
  all: 'Tous',
  teacher: 'Enseignants',
  parent: 'Parents',
}

export default async function TeacherAdminMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: messages } = await supabase
    .from('admin_broadcast_messages')
    .select('id, title, body, target_audience, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/teacher/dashboard" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Messages administration</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Communications envoyées par l&apos;équipe administrative.
        </p>
      </div>

      {!messages?.length ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500 text-sm">
          Aucun message pour le moment.
        </div>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap items-center gap-2 justify-between">
                <h2 className="font-semibold text-gray-900">{m.title}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {TARGET_LABEL[m.target_audience] ?? m.target_audience}
                  </span>
                  {new Date(m.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
              <div className="px-5 py-4 text-sm text-gray-700 whitespace-pre-wrap">{m.body}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
