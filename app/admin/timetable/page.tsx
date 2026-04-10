import { createClient } from '@/lib/supabase/server'
import { TimetableSearch } from './TimetableSearch'

export default async function TimetablePage() {
  const supabase = await createClient()

  const [{ data: classes }, { data: teachers }] = await Promise.all([
    supabase.from('classes').select('id, name, grade_level').order('name'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'teacher')
      .order('full_name'),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
        <p className="text-gray-500 text-sm mt-1">
          Créez et gérez les emplois du temps par classe ou par enseignant.
        </p>
      </div>

      <TimetableSearch
        classes={classes ?? []}
        teachers={teachers ?? []}
      />
    </div>
  )
}
