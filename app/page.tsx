import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      redirect(`/${profile.role}/dashboard`);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">SMART e-Learning</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            منصة التعلم الذكي
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            تحسين التعلم عبر الإنترنت مع متابعة شخصية لكل طالب
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors md:text-lg"
            >
              ابدأ الآن
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 text-base font-medium text-indigo-600 bg-white border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors md:text-lg"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">👨‍🏫</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">للأساتذة</h3>
            <p className="text-gray-600">إدارة الدروس والتمارين ومتابعة أداء الطلاب</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">👨‍👩‍👧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">للأولياء</h3>
            <p className="text-gray-600">متابعة نتائج الأبناء والحضور والتنبيهات</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ذكاء اصطناعي</h3>
            <p className="text-gray-600">توصيات وتنبيهات ذكية لتحسين الأداء</p>
          </div>
        </div>
      </main>
    </div>
  );
}
