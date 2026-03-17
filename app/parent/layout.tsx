import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ParentSidebar from '@/components/parent/ParentSidebar'

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
    .single()

  if (profile?.role !== 'parent') redirect('/')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ParentSidebar profile={profile} signOutAction={signOut} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
