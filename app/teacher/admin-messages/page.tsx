import { createClient } from '@/lib/supabase/server'
import {
  AdminBroadcastMessagesList,
  type BroadcastReplyWithBroadcastId,
} from '@/components/admin-messages/AdminBroadcastMessagesList'

export default async function TeacherAdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ reply_error?: string; reply_sent?: string; contact?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: messages } = await supabase
    .from('admin_broadcast_messages')
    .select('id, title, body, target_audience, created_at')
    .order('created_at', { ascending: false })

  const ids = (messages ?? []).map((m) => m.id)
  const { data: replyData } =
    ids.length > 0
      ? await supabase
          .from('admin_broadcast_replies')
          .select(
            `
            id,
            broadcast_id,
            body,
            created_at,
            author:profiles!admin_broadcast_replies_author_id_fkey(full_name)
          `
          )
          .in('broadcast_id', ids)
          .order('created_at', { ascending: true })
      : { data: [] as BroadcastReplyWithBroadcastId[] }

  return (
    <AdminBroadcastMessagesList
      messages={messages ?? []}
      replyRows={(replyData ?? []) as BroadcastReplyWithBroadcastId[]}
      returnTo="/teacher/admin-messages"
      dashboardHref="/teacher/dashboard"
      dashboardLinkClassName="text-blue-600 hover:underline"
      accent="blue"
      replyError={sp.reply_error}
      replySent={sp.reply_sent === '1'}
      teacherContactSent={sp.contact === 'success'}
      newMessageHref="/teacher/admin-messages/new"
    />
  )
}
