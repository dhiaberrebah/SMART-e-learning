'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import type { ContentKind } from '@/lib/pedagogical-content-kind'

const KINDS: ContentKind[] = ['pdf', 'video', 'image', 'other']

export async function updatePedagogicalContent(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const classIdRaw = String(formData.get('class_id') ?? '').trim()
  const contentKindRaw = String(formData.get('content_kind') ?? '').trim()

  if (!id) redirect('/teacher/content?error=' + encodeURIComponent('Ressource introuvable.'))
  if (!title) redirect(`/teacher/content/${id}/edit?error=` + encodeURIComponent('Le titre est obligatoire.'))

  const content_kind = KINDS.includes(contentKindRaw as ContentKind) ? contentKindRaw : 'other'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: row } = await db
    .from('pedagogical_contents')
    .select('id, teacher_id')
    .eq('id', id)
    .maybeSingle()

  if (!row || row.teacher_id !== user.id) {
    redirect('/teacher/content?error=' + encodeURIComponent('Accès refusé.'))
  }

  const { error } = await db
    .from('pedagogical_contents')
    .update({
      title,
      description: description || null,
      class_id: classIdRaw || null,
      content_kind,
    })
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) {
    redirect(`/teacher/content/${id}/edit?error=` + encodeURIComponent(error.message))
  }

  redirect('/teacher/content?updated=1')
}
