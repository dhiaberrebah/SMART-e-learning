import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import TeacherSidebar from '@/components/teacher/TeacherSidebar'
import DashboardNavbar from '@/components/DashboardNavbar'

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
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 overflow-hidden">
      <DashboardNavbar signOutAction={signOut} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <TeacherSidebar profile={profile} signOutAction={signOut} />
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
