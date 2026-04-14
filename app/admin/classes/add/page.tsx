import { createClient } from '@/lib/supabase/server'
import { PRIMARY_GRADE_OPTIONS_TUNISIA } from '@/lib/grade-levels'
import { AddClassForm } from './AddClassForm'

export default async function AddClassPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'teacher')
    .order('full_name')

  const { data: subjectRows } = await supabase
    .from('subjects')
    .select('teacher_id, name')

  const specialtyMap: Record<string, string[]> = {}
  for (const s of subjectRows ?? []) {
    if (!s.teacher_id) continue
    if (!specialtyMap[s.teacher_id]) specialtyMap[s.teacher_id] = []
    const norm = s.name.trim()
    if (!specialtyMap[s.teacher_id].includes(norm)) {
      specialtyMap[s.teacher_id].push(norm)
    }
  }

  const teachersWithSpecialties = (teachers ?? []).map((t) => ({
    ...t,
    specialties: specialtyMap[t.id] ?? [],
  }))

  return (
    <AddClassForm
      teachers={teachersWithSpecialties}
      gradeOptions={PRIMARY_GRADE_OPTIONS_TUNISIA}
      error={sp.error}
    />
  )
}
