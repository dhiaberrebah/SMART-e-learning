import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ClassesManagement() {
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

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const { data: classes } = await supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey(full_name),
      students(count)
    `)
    .order('created_at', { ascending: false })

  const { data: teachers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                ← العودة
              </Link>
              <h1 className="text-xl font-bold text-indigo-600">إدارة الفصول الدراسية</h1>
            </div>
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">الفصول الدراسية</h2>
            <p className="text-gray-600 mt-1">إدارة الفصول والمواد الدراسية</p>
          </div>
          <Link
            href="/admin/classes/add"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            + إضافة فصل جديد
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">إجمالي الفصول</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{classes?.length || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">المعلمون المعينون</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {classes?.filter(c => c.teacher_id).length || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">إجمالي الطلاب</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {classes?.reduce((sum, c) => sum + (c.students?.[0]?.count || 0), 0) || 0}
            </p>
          </div>
        </div>

        {classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{classItem.name}</h3>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded">
                      {classItem.grade_level || 'غير محدد'}
                    </span>
                  </div>
                  
                  {classItem.description && (
                    <p className="text-sm text-gray-600 mb-4">{classItem.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      المعلم: {classItem.teacher?.full_name || 'غير معين'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      الطلاب: {classItem.students?.[0]?.count || 0}
                    </div>
                    {classItem.academic_year && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        العام الدراسي: {classItem.academic_year}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t">
                    <Link
                      href={`/admin/classes/${classItem.id}`}
                      className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-center text-sm font-medium"
                    >
                      عرض التفاصيل
                    </Link>
                    <Link
                      href={`/admin/classes/edit/${classItem.id}`}
                      className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-center text-sm font-medium"
                    >
                      تعديل
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد فصول دراسية</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة فصل دراسي جديد</p>
            <div className="mt-6">
              <Link
                href="/admin/classes/add"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                + إضافة فصل جديد
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
