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

  return (
    <AddClassForm
      teachers={teachers ?? []}
      gradeOptions={PRIMARY_GRADE_OPTIONS_TUNISIA}
      error={sp.error}
    />
  )
}
