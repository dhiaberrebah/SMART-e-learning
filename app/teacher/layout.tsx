import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import TeacherSidebar from '@/components/teacher/TeacherSidebar'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'teacher') redirect('/')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <TeacherSidebar profile={profile} signOutAction={signOut} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
