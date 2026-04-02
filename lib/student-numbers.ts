import type { SupabaseClient } from '@supabase/supabase-js'

/** Prochain numéro = max(numéros entiers existants) + 1 */
export async function nextStudentNumber(db: SupabaseClient): Promise<number> {
  const { data } = await db.from('students').select('student_number')
  let max = 0
  for (const row of data ?? []) {
    const n = parseInt(String(row.student_number ?? '').trim(), 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max + 1
}

/**
 * Réattribue 1 … n selon created_at puis id (valeurs temporaires uniques pour respecter UNIQUE).
 */
export async function renumberStudentsSequential(db: SupabaseClient): Promise<void> {
  const { data: rows } = await db
    .from('students')
    .select('id')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (!rows?.length) return

  for (const row of rows) {
    const tmp = `_${String(row.id).replace(/-/g, '').slice(0, 12)}`
    await db.from('students').update({ student_number: tmp }).eq('id', row.id)
  }
  for (let i = 0; i < rows.length; i++) {
    await db.from('students').update({ student_number: String(i + 1) }).eq('id', rows[i].id)
  }
}
