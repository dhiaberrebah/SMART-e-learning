import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ParentSidebar from '@/components/parent/ParentSidebar'
import DashboardNavbar from '@/components/DashboardNavbar'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'parent') redirect('/')

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <DashboardNavbar signOutAction={signOut} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ParentSidebar profile={profile} signOutAction={signOut} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
