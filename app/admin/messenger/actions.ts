'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function sendAdminBroadcast(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (prof?.role !== 'admin') {
    redirect('/admin/messenger?error=' + encodeURIComponent('Accès refusé'))
  }

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const target = String(formData.get('target_audience') ?? 'all')

  if (!title || !body) {
    redirect('/admin/messenger?error=' + encodeURIComponent('Titre et message sont requis'))
  }
  if (!['all', 'teacher', 'parent'].includes(target)) {
    redirect('/admin/messenger?error=' + encodeURIComponent('Cible invalide'))
  }

  const { data: row, error } = await supabase
    .from('admin_broadcast_messages')
    .insert({
      title,
      body,
      target_audience: target,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    redirect('/admin/messenger?error=' + encodeURIComponent(error.message))
  }

  redirect(`/admin/messenger?thread=${row.id}&success=1`)
}
