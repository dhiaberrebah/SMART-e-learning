'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient()
  const eventId = formData.get('event_id') as string
  if (!eventId) redirect('/admin/announcements')
  await supabase.from('event_targets').delete().eq('event_id', eventId)
  await supabase.from('events').delete().eq('id', eventId)
  redirect('/admin/announcements?success=deleted')
}

export async function prolongEvent(formData: FormData) {
  const supabase = await createClient()
  const eventId = formData.get('event_id') as string
  const daysRaw = parseInt(String(formData.get('days') || '7'), 10)
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 365) : 7
  if (!eventId) redirect('/admin/announcements')

  const { data: ev, error } = await supabase
    .from('events')
    .select('start_at, end_at')
    .eq('id', eventId)
    .maybeSingle()

  if (error || !ev) redirect('/admin/announcements?error=' + encodeURIComponent('Événement introuvable'))

  const base = new Date(ev.end_at || ev.start_at)
  base.setDate(base.getDate() + days)

  const { error: upErr } = await supabase.from('events').update({ end_at: base.toISOString() }).eq('id', eventId)
  if (upErr) {
    redirect('/admin/announcements?error=' + encodeURIComponent(upErr.message))
  }
  redirect('/admin/announcements?success=prolonged')
}

export async function updateEvent(formData: FormData) {
  const supabase = await createClient()
  const eventId = formData.get('event_id') as string
  const title = (formData.get('title') as string)?.trim()
  const startAt = formData.get('start_at') as string
  const endAtRaw = (formData.get('end_at') as string)?.trim()

  if (!eventId || !title || !startAt) {
    redirect(eventId ? `/admin/announcements/edit/${eventId}?error=` + encodeURIComponent('Champs requis manquants') : '/admin/announcements')
  }

  const { error } = await supabase
    .from('events')
    .update({
      title,
      description: ((formData.get('description') as string) || '').trim() || null,
      location: ((formData.get('location') as string) || '').trim() || null,
      start_at: startAt,
      end_at: endAtRaw || null,
    })
    .eq('id', eventId)

  if (error) {
    redirect(`/admin/announcements/edit/${eventId}?error=` + encodeURIComponent(error.message))
  }

  await supabase.from('event_targets').delete().eq('event_id', eventId)
  const classIds = formData.getAll('class_ids[]') as string[]
  if (classIds.length > 0) {
    await supabase.from('event_targets').insert(
      classIds.map((classId) => ({
        event_id: eventId,
        target_type: 'class',
        class_id: classId,
      }))
    )
  }

  redirect('/admin/announcements?success=updated')
}
