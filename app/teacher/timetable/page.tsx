import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TimetableGrid } from '@/components/admin/TimetableGrid'
import { TimetablePDFButton } from '@/components/TimetablePDFButton'

export default async function TeacherTimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: slots }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('timetable_slots')
      .select('*, class:classes(name)')
      .eq('teacher_id', user.id),
  ])

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mon emploi du temps</h1>
          <p className="text-sm text-gray-500">
            {profile?.full_name} · Vue hebdomadaire (lecture seule)
          </p>
        </div>
        <TimetablePDFButton
          slots={slots ?? []}
          title={`Emploi du temps — ${profile?.full_name ?? 'Enseignant'}`}
          filename={`emploi-du-temps-${(profile?.full_name ?? 'enseignant').replace(/\s+/g, '-')}.pdf`}
        />
      </div>

      {(slots ?? []).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">Aucun créneau assigné</p>
          <p className="text-xs text-gray-400 mt-1">L&apos;administration n&apos;a pas encore configuré votre emploi du temps.</p>
        </div>
      ) : (
        <TimetableGrid
          mode="teacher"
          slots={slots ?? []}
          teachers={[]}
          subjects={[]}
        />
      )}
    </div>
  )
}
