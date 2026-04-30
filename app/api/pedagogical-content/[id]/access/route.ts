import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const url = _req.nextUrl
  const modeRaw = url.searchParams.get('mode')
  const mode = modeRaw === 'download' ? 'download' : 'view'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const db = createServiceClient()
  const [{ data: profile }, { data: content }] = await Promise.all([
    db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    db
      .from('pedagogical_contents')
      .select('id, teacher_id, class_id, file_path')
      .eq('id', id)
      .maybeSingle(),
  ])

  if (!content?.file_path) {
    return new Response('Not found', { status: 404 })
  }

  let allowed = false

  if (profile?.role === 'teacher' && content.teacher_id === user.id) {
    allowed = true
  }

  if (profile?.role === 'parent' && content.class_id) {
    const { count } = await db
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', user.id)
      .eq('class_id', content.class_id)
    allowed = (count ?? 0) > 0
  }

  if (profile?.role === 'admin') {
    allowed = true
  }

  if (!allowed) {
    return new Response('Forbidden', { status: 403 })
  }

  const isOwnerTeacher = profile?.role === 'teacher' && content.teacher_id === user.id
  if (!isOwnerTeacher) {
    await db.from('pedagogical_content_events').insert({
      pedagogical_content_id: content.id,
      event_kind: mode,
      profile_id: user.id,
    })
  }

  return Response.redirect(content.file_path, 302)
}
