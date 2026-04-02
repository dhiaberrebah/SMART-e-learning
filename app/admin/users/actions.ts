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
  if (prof?.role !== 'admin') redirect('/admin/users?error=' + encodeURIComponent('Accès refusé'))

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const target = String(formData.get('target_audience') ?? 'all')

  if (!title || !body) {
    redirect('/admin/users?error=' + encodeURIComponent('Titre et message sont requis'))
  }
  if (!['all', 'teacher', 'parent'].includes(target)) {
    redirect('/admin/users?error=' + encodeURIComponent('Cible invalide'))
  }

  const { error } = await supabase.from('admin_broadcast_messages').insert({
    title,
    body,
    target_audience: target,
    created_by: user.id,
  })

  if (error) {
    redirect('/admin/users?error=' + encodeURIComponent(error.message))
  }
  redirect('/admin/users?success=broadcast')
}
