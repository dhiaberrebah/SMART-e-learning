import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EditUser({ params }: { params: { id: string } }) {
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

  const { data: editUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!editUser) {
    redirect('/admin/users')
  }

  const handleUpdateUser = async (formData: FormData) => {
    'use server'
    const supabase = await createClient()

    const fullName = formData.get('full_name') as string
    const role = formData.get('role') as string
    const userId = formData.get('user_id') as string

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        role: role,
      })
      .eq('id', userId)

    if (error) {
      redirect(`/admin/users/edit/${userId}?error=` + encodeURIComponent(error.message))
    }

    redirect('/admin/users?success=user_updated')
  }

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
              <Link href="/admin/users" className="text-gray-600 hover:text-gray-900">
                ← العودة
              </Link>
              <h1 className="text-xl font-bold text-indigo-600">تعديل مستخدم</h1>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">تعديل معلومات المستخدم</h2>
          
          <form action={handleUpdateUser} className="space-y-6">
            <input type="hidden" name="user_id" value={editUser.id} />
            
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                defaultValue={editUser.full_name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="أدخل الاسم الكامل"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                id="email"
                name="email"
                disabled
                defaultValue={editUser.email}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">لا يمكن تعديل البريد الإلكتروني</p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                الدور
              </label>
              <select
                id="role"
                name="role"
                required
                defaultValue={editUser.role}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="teacher">معلم</option>
                <option value="parent">ولي أمر</option>
                <option value="admin">مسؤول</option>
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">معلومات إضافية</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>تاريخ الإنشاء: {new Date(editUser.created_at).toLocaleDateString('ar-EG')}</p>
                <p>آخر تحديث: {new Date(editUser.updated_at).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                حفظ التعديلات
              </button>
              <Link
                href="/admin/users"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-center"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
