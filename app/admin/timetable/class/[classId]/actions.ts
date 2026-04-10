'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSlot(formData: FormData) {
  const supabase = await createClient()

  const class_id    = formData.get('class_id')    as string
  const teacher_id  = (formData.get('teacher_id') as string) || null
  const subject_name = (formData.get('subject_name') as string).trim()
  const day_of_week = Number(formData.get('day_of_week'))
  const slot_index  = Number(formData.get('slot_index'))
  const room        = (formData.get('room') as string).trim() || null

  if (!class_id || !subject_name || !day_of_week && day_of_week !== 0) return

  await supabase.from('timetable_slots').upsert(
    { class_id, teacher_id, subject_name, day_of_week, slot_index, room },
    { onConflict: 'class_id,day_of_week,slot_index' }
  )

  revalidatePath(`/admin/timetable/class/${class_id}`)
}

export async function deleteSlot(id: string, classId: string) {
  const supabase = await createClient()
  await supabase.from('timetable_slots').delete().eq('id', id)
  revalidatePath(`/admin/timetable/class/${classId}`)
}
