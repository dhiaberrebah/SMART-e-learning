import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-indigo-600">لوحة تحكم الأستاذ</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{profile?.full_name}</span>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">مرحباً، {profile?.full_name}</h2>
          <p className="text-gray-600 mt-1">هذه لوحة تحكم الأستاذ - قريباً سيتم إضافة المزيد من الميزات</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">إدارة المحتوى</h3>
            <p className="text-gray-600 text-sm mb-4">رفع الدروس والمواد التعليمية</p>
            <Link href="#" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              إدارة المحتوى →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">الطلاب</h3>
            <p className="text-gray-600 text-sm mb-4">متابعة أداء الطلاب</p>
            <Link href="#" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              عرض الطلاب →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">التحليلات</h3>
            <p className="text-gray-600 text-sm mb-4">تقارير وإحصائيات ذكية</p>
            <Link href="#" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              عرض التحليلات →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
