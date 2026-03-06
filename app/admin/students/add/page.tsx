import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AddStudent() {
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

  const { data: parents } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'parent')
    .order('full_name')

  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .order('name')

  const handleAddStudent = async (formData: FormData) => {
    'use server'
    const supabase = await createClient()

    const fullName = formData.get('full_name') as string
    const dateOfBirth = formData.get('date_of_birth') as string
    const studentNumber = formData.get('student_number') as string
    const parentId = formData.get('parent_id') as string
    const classId = formData.get('class_id') as string

    const { error } = await supabase
      .from('students')
      .insert({
        full_name: fullName,
        date_of_birth: dateOfBirth || null,
        student_number: studentNumber || null,
        parent_id: parentId || null,
        class_id: classId || null,
      })

    if (error) {
      redirect('/admin/students/add?error=' + encodeURIComponent(error.message))
    }

    redirect('/admin/students?success=student_added')
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
              <Link href="/admin/students" className="text-gray-600 hover:text-gray-900">
                ← العودة
              </Link>
              <h1 className="text-xl font-bold text-indigo-600">إضافة طالب جديد</h1>
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">معلومات الطالب</h2>
          
          <form action={handleAddStudent} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="أدخل الاسم الكامل للطالب"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="student_number" className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الطالب
                </label>
                <input
                  type="text"
                  id="student_number"
                  name="student_number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="مثال: 2024001"
                />
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الميلاد
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-2">
                ولي الأمر
              </label>
              <select
                id="parent_id"
                name="parent_id"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">اختر ولي الأمر</option>
                {parents?.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.full_name} - {parent.email}
                  </option>
                ))}
              </select>
              {(!parents || parents.length === 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  لا يوجد أولياء أمور في النظام. يمكنك إضافتهم من صفحة إدارة المستخدمين.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="class_id" className="block text-sm font-medium text-gray-700 mb-2">
                الفصل الدراسي
              </label>
              <select
                id="class_id"
                name="class_id"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">اختر الفصل</option>
                {classes?.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name} - {classItem.grade_level || 'غير محدد'}
                  </option>
                ))}
              </select>
              {(!classes || classes.length === 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  لا توجد فصول في النظام. يمكنك إضافة فصول من صفحة إدارة الفصول.
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                إضافة الطالب
              </button>
              <Link
                href="/admin/students"
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
