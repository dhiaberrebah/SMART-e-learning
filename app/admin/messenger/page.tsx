import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { sendAdminBroadcast } from './actions'

const TARGET_LABEL: Record<string, string> = {
  all: 'Tous',
  teacher: 'Enseignants',
  parent: 'Parents',
}

function roleReplyLabel(role: string | null | undefined) {
  if (role === 'parent') return 'Parent'
  if (role === 'teacher') return 'Enseignant'
  return 'Utilisateur'
}

export default async function AdminMessengerPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string; error?: string; success?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: threads } = await supabase
    .from('admin_broadcast_messages')
    .select('id, title, target_audience, created_at')
    .order('created_at', { ascending: false })
    .limit(60)

  const threadIds = (threads ?? []).map((t) => t.id)
  const { data: replyCountRows } =
    threadIds.length > 0
      ? await supabase.from('admin_broadcast_replies').select('broadcast_id').in('broadcast_id', threadIds)
      : { data: [] as { broadcast_id: string }[] }

  const replyCountById = new Map<string, number>()
  for (const r of replyCountRows ?? []) {
    replyCountById.set(r.broadcast_id, (replyCountById.get(r.broadcast_id) ?? 0) + 1)
  }

  const threadId = sp.thread?.match(/^[0-9a-f-]{36}$/i) ? sp.thread : null

  let activeThread: {
    id: string
    title: string
    body: string
    target_audience: string
    created_at: string
  } | null = null

  let replies: {
    id: string
    body: string
    created_at: string
    author: { full_name: string | null; role: string | null } | null
  }[] = []

  if (threadId) {
    const { data: bm } = await supabase
      .from('admin_broadcast_messages')
      .select('id, title, body, target_audience, created_at')
      .eq('id', threadId)
      .maybeSingle()
    if (bm) {
      activeThread = bm
      const { data: rep } = await supabase
        .from('admin_broadcast_replies')
        .select(
          `
          id,
          body,
          created_at,
          author:profiles!admin_broadcast_replies_author_id_fkey(full_name, role)
        `
        )
        .eq('broadcast_id', threadId)
        .order('created_at', { ascending: true })
      replies = (rep ?? []) as typeof replies
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-2rem)] max-w-[1400px] mx-auto p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
          <p className="text-gray-500 text-sm mt-1">
            Messages vers parents et enseignants — visibles sur leur tableau de bord et sur « Messages administration ».
          </p>
        </div>
        <Link
          href="/admin/users"
          className="text-sm text-indigo-600 hover:underline font-medium"
        >
          ← Utilisateurs
        </Link>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {sp.error}
        </div>
      )}
      {sp.success === '1' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg mb-4 text-sm">
          ✓ Message envoyé. La conversation est ouverte ci‑dessous.
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Thread list */}
        <aside className="w-full lg:w-80 lg:max-w-sm border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50 flex flex-col max-h-52 lg:max-h-none lg:min-h-[480px]">
          <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between gap-2 bg-gray-100/80">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Conversations</h2>
            <Link
              href="/admin/messenger"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Nouveau message
            </Link>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {(threads ?? []).length === 0 ? (
              <li className="px-3 py-6 text-sm text-gray-400 text-center">Aucun message envoyé</li>
            ) : (
              (threads ?? []).map((t) => {
                const active = t.id === threadId
                const n = replyCountById.get(t.id) ?? 0
                return (
                  <li key={t.id}>
                    <Link
                      href={`/admin/messenger?thread=${t.id}`}
                      className={`block px-3 py-3 text-left hover:bg-white transition-colors ${
                        active ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{t.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          {TARGET_LABEL[t.target_audience] ?? t.target_audience}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(t.created_at).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {n > 0 && (
                          <span className="text-[10px] font-semibold text-indigo-600">{n} rép.</span>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </aside>

        {/* Main: thread + composer */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[420px] lg:min-h-[480px]">
          <div className="flex-1 overflow-y-auto bg-slate-50/80 p-4 space-y-4">
            {activeThread ? (
              <>
                <div className="text-center text-xs text-gray-400 pb-2">
                  {new Date(activeThread.created_at).toLocaleString('fr-FR')}
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-indigo-600 text-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold text-indigo-200 mb-1">
                      Administration · {TARGET_LABEL[activeThread.target_audience] ?? activeThread.target_audience}
                    </p>
                    <p className="text-sm font-semibold">{activeThread.title}</p>
                    <p className="text-sm mt-2 whitespace-pre-wrap text-indigo-50">{activeThread.body}</p>
                  </div>
                </div>
                {replies.map((r) => (
                  <div key={r.id} className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white border border-gray-200 px-4 py-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">
                        <span className="font-semibold text-gray-800">
                          {r.author?.full_name?.trim() || 'Destinataire'}
                        </span>
                        <span className="text-gray-400">
                          {' '}
                          · {roleReplyLabel(r.author?.role)}
                        </span>
                        <span className="text-gray-300">
                          {' '}
                          · {new Date(r.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.body}</p>
                    </div>
                  </div>
                ))}
                {replies.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">Aucune réponse pour l&apos;instant.</p>
                )}
              </>
            ) : (
              <div className="h-full min-h-[200px] flex items-center justify-center text-center px-4">
                <div>
                  <p className="text-gray-500 text-sm">
                    Choisissez une conversation à gauche, ou envoyez un nouveau message ci‑dessous.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-gray-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Nouveau message</h3>
            <form action={sendAdminBroadcast} className="space-y-3 max-w-3xl">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
                <input
                  name="title"
                  required
                  placeholder="Objet du message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
                <textarea
                  name="body"
                  required
                  rows={3}
                  placeholder="Contenu visible par les destinataires…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-y min-h-[88px]"
                />
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="block text-xs font-semibold text-gray-900 mb-2">Destinataires</span>
                <div className="flex flex-col gap-2 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-900 font-medium">
                    <input
                      type="radio"
                      name="target_audience"
                      value="all"
                      defaultChecked
                      className="h-4 w-4 shrink-0 text-indigo-600 border-gray-800 accent-gray-900"
                    />
                    <span className="text-gray-900">Tous (parents + enseignants)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-900 font-medium">
                    <input
                      type="radio"
                      name="target_audience"
                      value="teacher"
                      className="h-4 w-4 shrink-0 text-indigo-600 border-gray-800 accent-gray-900"
                    />
                    <span className="text-gray-900">Enseignants uniquement</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-900 font-medium">
                    <input
                      type="radio"
                      name="target_audience"
                      value="parent"
                      className="h-4 w-4 shrink-0 text-indigo-600 border-gray-800 accent-gray-900"
                    />
                    <span className="text-gray-900">Parents uniquement</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
