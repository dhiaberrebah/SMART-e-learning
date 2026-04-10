import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TimetableGrid } from '@/components/admin/TimetableGrid'

export default async function TeacherTimetablePage({
  params,
}: {
  params: Promise<{ teacherId: string }>
}) {
  const { teacherId } = await params
  const supabase = await createClient()

  const [{ data: teacher }, { data: slots }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .maybeSingle(),
    supabase
      .from('timetable_slots')
      .select('*, class:classes(name)')
      .eq('teacher_id', teacherId),
  ])

  if (!teacher) notFound()

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/admin/timetable" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Emploi du temps — {teacher.full_name}
          </h1>
          <p className="text-sm text-gray-500">Vue récapitulative (lecture seule)</p>
        </div>
      </div>

      <TimetableGrid
        mode="teacher"
        slots={slots ?? []}
        teachers={[]}
        subjects={[]}
      />
    </div>
  )
}
