import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TimetableGrid } from '@/components/admin/TimetableGrid'
import { TimetablePDFButton } from '@/components/TimetablePDFButton'

export default async function ParentTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ child_id?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: children } = await supabase
    .from('students')
    .select('id, full_name, class_id, class:classes(id, name, grade_level)')
    .eq('parent_id', user.id)
    .order('full_name')

  const selected = sp.child_id
    ? (children ?? []).find((c: any) => c.id === sp.child_id)
    : (children ?? [])[0]

  const classId = (selected as any)?.class_id ?? null

  const { data: slots } = classId
    ? await supabase
        .from('timetable_slots')
        .select('*, teacher:profiles(full_name)')
        .eq('class_id', classId)
    : { data: [] }

  const cls = (selected as any)?.class ?? null

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Emploi du temps</h1>
          {cls && (
            <p className="text-sm text-gray-500">
              {cls.name}{cls.grade_level ? ` · ${cls.grade_level}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {(children ?? []).length > 1 && (
            <div className="flex items-center gap-2">
              {(children as any[]).map((child) => (
                <Link
                  key={child.id}
                  href={`/parent/timetable?child_id=${child.id}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selected?.id === child.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {child.full_name}
                </Link>
              ))}
            </div>
          )}
          {selected && (slots ?? []).length > 0 && (
            <TimetablePDFButton
              slots={slots ?? []}
              title={`Emploi du temps — ${(selected as any).full_name}${cls ? ` · ${cls.name}` : ''}`}
              filename={`emploi-du-temps-${((selected as any).full_name ?? 'enfant').replace(/\s+/g, '-')}.pdf`}
            />
          )}
        </div>
      </div>

      {!(children ?? []).length ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-sm font-medium text-gray-700">Aucun enfant associé</p>
          <p className="text-xs text-gray-400 mt-1">
            Vos enfants apparaîtront ici une fois enregistrés par l&apos;administration.
          </p>
        </div>
      ) : !classId ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-sm font-medium text-gray-700">Aucune classe assignée</p>
          <p className="text-xs text-gray-400 mt-1">
            {(selected as any)?.full_name} n&apos;est pas encore inscrit(e) dans une classe.
          </p>
        </div>
      ) : (slots ?? []).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">Emploi du temps non disponible</p>
          <p className="text-xs text-gray-400 mt-1">
            L&apos;administration n&apos;a pas encore configuré l&apos;emploi du temps de la classe {cls?.name}.
          </p>
        </div>
      ) : (
        <TimetableGrid
          mode="class"
          slots={slots ?? []}
          teachers={[]}
          subjects={[]}
        />
      )}
    </div>
  )
}
