'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const REDIRECT_PUBLIC = '/' as const
const TEACHER_FORM = '/teacher/admin-messages/new' as const
const TEACHER_LIST = '/teacher/admin-messages' as const

function sanitize(s: string, max: number) {
  return s.trim().slice(0, max)
}

function contactQuery(status: string) {
  return `?contact=${encodeURIComponent(status)}`
}

export async function submitContactAdmin(formData: FormData) {
  const redirectContext = String(formData.get('redirect_context') ?? '').trim()
  const isTeacherInApp = redirectContext === 'teacher_admin'

  if (isTeacherInApp) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role !== 'teacher') redirect('/login')
  }

  const full_name = sanitize((formData.get('full_name') as string) || '', 200)
  const email = sanitize((formData.get('email') as string) || '', 320)
  const phone = sanitize((formData.get('phone') as string) || '', 40)
  const subject = sanitize((formData.get('subject') as string) || '', 200)
  const message = sanitize((formData.get('message') as string) || '', 8000)

  if (!full_name || !email || !message) {
    redirect(
      isTeacherInApp ? `${TEACHER_FORM}${contactQuery('missing')}` : `${REDIRECT_PUBLIC}${contactQuery('missing')}`
    )
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailOk) {
    redirect(
      isTeacherInApp
        ? `${TEACHER_FORM}${contactQuery('invalid_email')}`
        : `${REDIRECT_PUBLIC}${contactQuery('invalid_email')}`
    )
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
    redirect(isTeacherInApp ? `${TEACHER_FORM}${contactQuery('error')}` : `${REDIRECT_PUBLIC}${contactQuery('error')}`)
  }

  redirect(
    isTeacherInApp ? `${TEACHER_LIST}${contactQuery('success')}` : `${REDIRECT_PUBLIC}${contactQuery('success')}`
  )
}
