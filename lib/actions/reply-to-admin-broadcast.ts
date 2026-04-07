'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const MAX_LEN = 4000

export async function replyToAdminBroadcast(formData: FormData) {
  const returnToRaw = String(formData.get('return_to') ?? '/parent/admin-messages')
  const returnTo =
    returnToRaw === '/parent/admin-messages' || returnToRaw === '/teacher/admin-messages'
      ? returnToRaw
      : '/parent/admin-messages'

  const broadcastId = String(formData.get('broadcast_id') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!broadcastId) {
    redirect(`${returnTo}?reply_error=` + encodeURIComponent('Message introuvable.'))
  }
  if (!body) {
    redirect(`${returnTo}?reply_error=` + encodeURIComponent('Saisissez une réponse.'))
  }
  if (body.length > MAX_LEN) {
    redirect(
      `${returnTo}?reply_error=` +
        encodeURIComponent(`Réponse trop longue (max. ${MAX_LEN} caractères).`)
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase.from('admin_broadcast_replies').insert({
    broadcast_id: broadcastId,
    author_id: user.id,
    body,
  })

  if (error) {
    redirect(`${returnTo}?reply_error=` + encodeURIComponent(error.message))
  }

  redirect(`${returnTo}?reply_sent=1`)
}
