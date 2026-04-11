import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TimetableGrid } from '@/components/admin/TimetableGrid'
import { TimetablePDFButton } from '@/components/TimetablePDFButton'
import { addSlot, deleteSlot } from './actions'

export default async function ClassTimetablePage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { classId } = await params
  const supabase = await createClient()

  const [{ data: cls }, { data: slots }, { data: teachers }, { data: subjects }] =
    await Promise.all([
      supabase
        .from('classes')
        .select('id, name, grade_level')
        .eq('id', classId)
        .maybeSingle(),
      supabase
        .from('timetable_slots')
        .select('*, teacher:profiles(full_name)')
        .eq('class_id', classId),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'teacher')
        .order('full_name'),
      supabase
        .from('subjects')
        .select('id, name')
        .eq('class_id', classId)
        .order('name'),
    ])

  if (!cls) notFound()

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/timetable" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Emploi du temps — {cls.name}
            </h1>
            {cls.grade_level && (
              <p className="text-sm text-gray-500">{cls.grade_level}</p>
            )}
          </div>
        </div>
        <TimetablePDFButton
          slots={slots ?? []}
          title={`Emploi du temps — ${cls.name}${cls.grade_level ? ` (${cls.grade_level})` : ''}`}
          filename={`emploi-du-temps-${cls.name.replace(/\s+/g, '-')}.pdf`}
        />
      </div>

      <TimetableGrid
        mode="class"
        classId={classId}
        slots={slots ?? []}
        teachers={teachers ?? []}
        subjects={(subjects ?? []).map((s) => s.name)}
        addSlot={addSlot}
        deleteSlot={deleteSlot}
      />
    </div>
  )
}
