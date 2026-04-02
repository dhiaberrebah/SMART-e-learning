import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PRIMARY_GRADE_OPTIONS_TUNISIA } from '@/lib/grade-levels'

async function handleUpdate(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const classId = formData.get('class_id') as string

  const name = ((formData.get('name') as string) || '').trim()
  if (!name) {
    redirect(`/admin/classes/edit/${classId}?error=` + encodeURIComponent('Le nom de la classe est obligatoire.'))
  }

  const { data: others } = await supabase.from('classes').select('id, name').neq('id', classId)
  const nameLower = name.toLowerCase()
  const dup = (others ?? []).some((o) => o.name.trim().toLowerCase() === nameLower)
  if (dup) {
    redirect(
      `/admin/classes/edit/${classId}?error=` +
        encodeURIComponent('Ce nom est déjà utilisé par une autre classe (doublon interdit).')
    )
  }

  const { error } = await supabase
    .from('classes')
    .update({
      name,
      description: (formData.get('description') as string) || null,
      grade_level: (formData.get('grade_level') as string) || null,
      academic_year: (formData.get('academic_year') as string) || null,
      teacher_id: (formData.get('teacher_id') as string) || null,
    })
    .eq('id', classId)

  if (error) {
    if (error.code === '23505' || error.message.toLowerCase().includes('unique')) {
      redirect(
        `/admin/classes/edit/${classId}?error=` +
          encodeURIComponent('Ce nom est déjà utilisé (contrainte d’unicité en base).')
      )
    }
    redirect(`/admin/classes/edit/${classId}?error=` + encodeURIComponent(error.message))
  }
  redirect('/admin/classes?success=class_updated')
}

async function handleDelete(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const classId = formData.get('class_id') as string

  // Unlink students before deleting
  await supabase.from('students').update({ class_id: null }).eq('class_id', classId)
  await supabase.from('classes').delete().eq('id', classId)

  redirect('/admin/classes?success=class_deleted')
}

export default async function EditClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams
  const supabase = await createClient()

  const [{ data: cls }, { data: teachers }, { count: studentCount }] = await Promise.all([
    supabase.from('classes').select('*').eq('id', id).maybeSingle(),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher').order('full_name'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('class_id', id),
  ])

  if (!cls) redirect('/admin/classes')

  const baseGrades = [...PRIMARY_GRADE_OPTIONS_TUNISIA] as string[]
  const gradeOptions =
    cls.grade_level && !baseGrades.includes(cls.grade_level)
      ? [cls.grade_level, ...baseGrades]
      : baseGrades

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/classes" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier la classe</h1>
          <p className="text-gray-500 text-sm mt-0.5">{cls.name}</p>
        </div>
      </div>

      {errorParam && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(errorParam)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <form action={handleUpdate} className="space-y-5">
          <input type="hidden" name="class_id" value={cls.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom de la classe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={cls.name}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lors de la création, le nom est généré automatiquement (niveau + a, b, c…). Vous pouvez l’ajuster ici sans dupliquer un nom existant.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={cls.description || ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Niveau scolaire</label>
              <select
                name="grade_level"
                defaultValue={cls.grade_level || ''}
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Choisir un niveau</option>
                {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Année scolaire</label>
              <input
                type="text"
                name="academic_year"
                defaultValue={cls.academic_year || ''}
                placeholder="Ex : 2024-2025"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Enseignant responsable</label>
            <select
              name="teacher_id"
              defaultValue={cls.teacher_id || ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">Aucun enseignant assigné</option>
              {teachers?.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            {studentCount || 0} élève(s) inscrit(s) — Créée le {new Date(cls.created_at).toLocaleDateString('fr-FR')}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
              Enregistrer
            </button>
            <Link href="/admin/classes" className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center">
              Annuler
            </Link>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-red-100">
        <h2 className="text-sm font-semibold text-red-700 mb-3">Zone dangereuse</h2>
        <p className="text-sm text-gray-500 mb-4">
          Supprimer cette classe désinscrira les {studentCount || 0} élève(s) associé(s). Cette action est irréversible.
        </p>
        <form action={handleDelete}>
          <input type="hidden" name="class_id" value={cls.id} />
          <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
            Supprimer la classe
          </button>
        </form>
      </div>
    </div>
  )
}
