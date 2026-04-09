import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPublicSiteUrl } from '@/lib/site-url'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let email = ''
  try {
    const body = await req.json()
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    console.error('[forgot-password] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return NextResponse.json({ error: 'Configuration serveur incomplète.' }, { status: 500 })
  }

  const supabase = createClient(url, anonKey)
  const redirectTo = `${getPublicSiteUrl()}/auth/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    console.error('[forgot-password]', error.message)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
