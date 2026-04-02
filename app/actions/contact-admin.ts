'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'

function sanitize(s: string, max: number) {
  return s.trim().slice(0, max)
}

export async function submitContactAdmin(formData: FormData) {
  const full_name = sanitize((formData.get('full_name') as string) || '', 200)
  const email = sanitize((formData.get('email') as string) || '', 320)
  const phone = sanitize((formData.get('phone') as string) || '', 40)
  const subject = sanitize((formData.get('subject') as string) || '', 200)
  const message = sanitize((formData.get('message') as string) || '', 8000)

  if (!full_name || !email || !message) {
    redirect('/?contact=missing')
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailOk) {
    redirect('/?contact=invalid_email')
  }

  const db = createServiceClient()
  const { error } = await db.from('contact_messages').insert({
    full_name,
    email,
    phone: phone || null,
    subject: subject || null,
    message,
  })

  if (error) {
    redirect('/?contact=error')
  }

  redirect('/?contact=success')
}
