import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AddClass() {
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

  const { data: teachers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('full_name')

  const handleAddClass = async (formData: FormData) => {
    'use server'
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const gradeLevel = formData.get('grade_level') as string
    const academicYear = formData.get('academic_year') as string
    const teacherId = formData.get('teacher_id') as string

    const { error } = await supabase
      .from('classes')
      .insert({
        name,
        description,
        grade_level: gradeLevel,
        academic_year: academicYear,
        teacher_id: teacherId || null,
      })

    if (error) {
      redirect('/admin/classes/add?error=' + encodeURIComponent(error.message))
    }

    redirect('/admin/classes?success=class_added')
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
              <Link href="/admin/classes" className="text-gray-600 hover:text-gray-900">
                ← العودة
              </Link>
              <h1 className="text-xl font-bold text-indigo-600">إضافة فصل دراسي جديد</h1>
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">معلومات الفصل الدراسي</h2>
          
          <form action={handleAddClass} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                اسم الفصل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="مثال: الصف الأول - أ"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="وصف مختصر للفصل الدراسي"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700 mb-2">
                  المستوى الدراسي
                </label>
                <select
                  id="grade_level"
                  name="grade_level"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">اختر المستوى</option>
                  <option value="الصف الأول">الصف الأول</option>
                  <option value="الصف الثاني">الصف الثاني</option>
                  <option value="الصف الثالث">الصف الثالث</option>
                  <option value="الصف الرابع">الصف الرابع</option>
                  <option value="الصف الخامس">الصف الخامس</option>
                  <option value="الصف السادس">الصف السادس</option>
                  <option value="الصف السابع">الصف السابع</option>
                  <option value="الصف الثامن">الصف الثامن</option>
                  <option value="الصف التاسع">الصف التاسع</option>
                  <option value="الصف العاشر">الصف العاشر</option>
                  <option value="الصف الحادي عشر">الصف الحادي عشر</option>
                  <option value="الصف الثاني عشر">الصف الثاني عشر</option>
                </select>
              </div>

              <div>
                <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 mb-2">
                  العام الدراسي
                </label>
                <input
                  type="text"
                  id="academic_year"
                  name="academic_year"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="مثال: 2024-2025"
                />
              </div>
            </div>

            <div>
              <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700 mb-2">
                المعلم المسؤول
              </label>
              <select
                id="teacher_id"
                name="teacher_id"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">اختر المعلم</option>
                {teachers?.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
              {(!teachers || teachers.length === 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  لا يوجد معلمون في النظام. يمكنك إضافة معلمين من صفحة إدارة المستخدمين.
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                إضافة الفصل
              </button>
              <Link
                href="/admin/classes"
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
