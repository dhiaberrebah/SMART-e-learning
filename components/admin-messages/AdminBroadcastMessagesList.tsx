import Link from 'next/link'
import { replyToAdminBroadcast } from '@/lib/actions/reply-to-admin-broadcast'

const TARGET_LABEL: Record<string, string> = {
  all: 'Tous',
  teacher: 'Enseignants',
  parent: 'Parents',
}

export type BroadcastMessageRow = {
  id: string
  title: string
  body: string
  target_audience: string
  created_at: string
}

export type BroadcastReplyRow = {
  id: string
  body: string
  created_at: string
  author?: { full_name?: string | null } | null
}

export type BroadcastReplyWithBroadcastId = BroadcastReplyRow & { broadcast_id: string }

function groupReplies(
  rows: BroadcastReplyWithBroadcastId[] | null | undefined,
  broadcastIds: string[]
): Record<string, BroadcastReplyRow[]> {
  const map: Record<string, BroadcastReplyRow[]> = {}
  for (const id of broadcastIds) map[id] = []
  for (const r of rows ?? []) {
    if (!map[r.broadcast_id]) continue
    map[r.broadcast_id].push({
      id: r.id,
      body: r.body,
      created_at: r.created_at,
      author: r.author,
    })
  }
  for (const id of broadcastIds) {
    map[id].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }
  return map
}

type Props = {
  messages: BroadcastMessageRow[]
  replyRows: BroadcastReplyWithBroadcastId[]
  returnTo: '/parent/admin-messages' | '/teacher/admin-messages'
  dashboardHref: string
  dashboardLinkClassName: string
  accent: 'emerald' | 'blue'
  replyError?: string
  replySent?: boolean
  /** After envoi via contact_messages (parcours enseignant) */
  teacherContactSent?: boolean
  /** Compose page for a new administration message */
  newMessageHref?: string
}

export function AdminBroadcastMessagesList({
  messages,
  replyRows,
  returnTo,
  dashboardHref,
  dashboardLinkClassName,
  accent,
  replyError,
  replySent,
  teacherContactSent,
  newMessageHref,
}: Props) {
  const ids = messages.map((m) => m.id)
  const repliesById = groupReplies(replyRows as BroadcastReplyRow[], ids)

  const btnPrimary =
    accent === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white'

  const replyBg = accent === 'emerald' ? 'bg-emerald-50/60 border-emerald-100' : 'bg-blue-50/60 border-blue-100'
  const focusRing = accent === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-blue-500'

  return (
    <div className="p-6 max-w-3xl mx-auto h-full overflow-y-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href={dashboardHref} className={`text-sm mb-2 inline-block ${dashboardLinkClassName}`}>
            ← Tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Messages administration</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Communications de l&apos;équipe administrative. Vous pouvez répondre ci-dessous chaque message.
          </p>
        </div>
        {newMessageHref ? (
          <Link
            href={newMessageHref}
            className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${btnPrimary}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau message
          </Link>
        ) : null}
      </div>

      {teacherContactSent && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Votre message a été transmis à l&apos;administration.
        </div>
      )}
      {replySent && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Votre réponse a été envoyée.
        </div>
      )}
      {replyError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {replyError}
        </div>
      )}

      {!messages.length ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500 text-sm">
          Aucun message pour le moment.
        </div>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => {
            const replies = repliesById[m.id] ?? []
            return (
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
                <div className="px-5 py-4 text-sm text-gray-700 whitespace-pre-wrap border-b border-gray-50">
                  {m.body}
                </div>

                {replies.length > 0 && (
                  <div className={`px-5 py-3 space-y-3 border-b border-gray-50 ${replyBg}`}>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Réponses</p>
                    <ul className="space-y-2">
                      {replies.map((r) => (
                        <li key={r.id} className="text-sm rounded-lg bg-white/80 border border-gray-100 px-3 py-2">
                          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {r.author?.full_name?.trim() || 'Vous'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(r.created_at).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{r.body}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="px-5 py-4 bg-gray-50/80">
                  <p className="text-xs font-medium text-gray-600 mb-2">Votre réponse</p>
                  <form action={replyToAdminBroadcast} className="space-y-2">
                    <input type="hidden" name="return_to" value={returnTo} />
                    <input type="hidden" name="broadcast_id" value={m.id} />
                    <textarea
                      name="body"
                      required
                      rows={3}
                      maxLength={4000}
                      placeholder="Écrire une réponse à l&apos;administration…"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-offset-0 focus:outline-none resize-y min-h-[80px] bg-white ${focusRing}`}
                    />
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${btnPrimary}`}
                    >
                      Envoyer la réponse
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
