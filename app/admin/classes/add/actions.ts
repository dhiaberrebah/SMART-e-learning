'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  buildAutoClassName,
  classNameTakenForSameYear,
  normalizeAcademicYearKey,
  nextClassSectionLetter,
} from '@/lib/class-name'

type Assignment = { teacher_id: string; subject_name: string }

export async function handleAddClass(formData: FormData) {
  const supabase = await createClient()

  const grade_level = ((formData.get('grade_level') as string) || '').trim()
  const academic_year =
    ((formData.get('academic_year') as string) || '').trim() || null
  const description =
    ((formData.get('description') as string) || '').trim() || null
  const assignmentsRaw = (formData.get('assignments') as string) || '[]'

  let assignments: Assignment[] = []
  try {
    assignments = JSON.parse(assignmentsRaw)
  } catch {
    assignments = []
  }
  // keep only complete rows
  assignments = assignments.filter((a) => a.teacher_id && a.subject_name.trim())

  if (!grade_level) {
    redirect(
      '/admin/classes/add?error=' +
        encodeURIComponent(
          'Le niveau scolaire est obligatoire : le nom de la classe sera généré automatiquement (ex. 1re année a).'
        )
    )
  }

  const { data: sameLevelRows, error: fetchErr } = await supabase
    .from('classes')
    .select('name, academic_year')
    .eq('grade_level', grade_level)

  if (fetchErr) {
    redirect('/admin/classes/add?error=' + encodeURIComponent(fetchErr.message))
  }

  // Même niveau : la section suit l’alphabet en tenant compte de *toutes* les classes du niveau
  // (a, puis b, puis c…), quelle que soit l’année scolaire.
  const siblingNames = (sameLevelRows ?? []).map((r) => r.name)

  const letter = nextClassSectionLetter(grade_level, siblingNames)
  if (!letter) {
    redirect(
      '/admin/classes/add?error=' +
        encodeURIComponent(
          'Nombre maximum de sections atteint pour ce niveau (a–z).'
        )
    )
  }

  const name = buildAutoClassName(grade_level, letter)

  const yearKey = normalizeAcademicYearKey(academic_year)
  const { data: nameRows } = await supabase.from('classes').select('name, academic_year')
  if (classNameTakenForSameYear(name, academic_year, nameRows ?? [])) {
    const yearHint = yearKey || 'année non renseignée'
    redirect(
      '/admin/classes/add?error=' +
        encodeURIComponent(
          `Une classe nommée « ${name} » existe déjà pour l’année « ${yearHint} ». Indiquez une autre année scolaire, ou renommez / supprimez l’entrée existante.`
        )
    )
  }

  const { data: newClass, error: classErr } = await supabase
    .from('classes')
    .insert({ name, description, grade_level, academic_year })
    .select('id')
    .single()

  if (classErr) {
    if (
      classErr.code === '23505' ||
      classErr.message.toLowerCase().includes('unique')
    ) {
      redirect(
        '/admin/classes/add?error=' +
          encodeURIComponent(
            "Un nom de classe identique existe déjà (contrainte d'unicité)."
          )
      )
    }
    redirect('/admin/classes/add?error=' + encodeURIComponent(classErr.message))
  }

  if (assignments.length > 0 && newClass) {
    const subjectsToInsert = assignments.map((a) => ({
      name: a.subject_name.trim(),
      class_id: newClass.id,
      teacher_id: a.teacher_id,
    }))
    await supabase.from('subjects').insert(subjectsToInsert)
  }

  redirect('/admin/classes?success=class_added')
}
