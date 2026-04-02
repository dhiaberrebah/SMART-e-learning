'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CURRICULUM_PRESET_LABELS } from '@/lib/primary-curriculum-presets'

function norm(s: string) {
  return s.trim().toLowerCase()
}

export async function removeCurriculumItem(formData: FormData) {
  const supabase = await createClient()
  const classId = (formData.get('class_id') as string) || ''
  const itemId = (formData.get('item_id') as string) || ''
  if (!classId || !itemId) redirect(classId ? `/admin/classes/${classId}?curriculum_error=missing` : '/admin/classes')

  await supabase.from('class_curriculum_items').delete().eq('id', itemId).eq('class_id', classId)
  redirect(`/admin/classes/${classId}?success=curriculum_updated`)
}

export async function applyCurriculumPreset(formData: FormData) {
  const supabase = await createClient()
  const classId = (formData.get('class_id') as string) || ''
  const presetKey = (formData.get('preset_key') as string) || ''
  if (!classId || !presetKey) redirect(`/admin/classes/${classId}?curriculum_error=missing`)

  const preset = CURRICULUM_PRESET_LABELS[presetKey]
  if (!preset) redirect(`/admin/classes/${classId}?curriculum_error=invalid_preset`)

  const { data: existing } = await supabase
    .from('class_curriculum_items')
    .select('id, name, sort_order')
    .eq('class_id', classId)

  const taken = new Set((existing ?? []).map((r: { name: string }) => norm(r.name)))
  let order =
    (existing ?? []).reduce((m, r: { sort_order?: number }) => Math.max(m, r.sort_order ?? 0), 0) + 1

  for (const name of preset.names) {
    const n = name.trim()
    if (!n || taken.has(norm(n))) continue
    const { error } = await supabase.from('class_curriculum_items').insert({
      class_id: classId,
      name: n,
      sort_order: order++,
    })
    if (!error) taken.add(norm(n))
  }

  redirect(`/admin/classes/${classId}?success=curriculum_preset_applied`)
}
