import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { normalizeParentCin } from '@/lib/parent-cin'

async function handleUpdate(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const studentId = formData.get('student_id') as string

  const rawCin = (formData.get('parent_cin') as string) || ''
  const parentCinNorm = normalizeParentCin(rawCin)

  let parent_id: string | null = null
  let enrollment_parent_cin: string | null = null

  if (parentCinNorm) {
    const { data: par } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'parent')
      .eq('cin', parentCinNorm)
      .maybeSingle()
    if (par) {
      parent_id = par.id
      enrollment_parent_cin = null
    } else {
      parent_id = null
      enrollment_parent_cin = parentCinNorm
    }
  } else {
    parent_id = null
    enrollment_parent_cin = null
  }

  const { error } = await supabase
    .from('students')
    .update({
      full_name: formData.get('full_name') as string,
      date_of_birth: (formData.get('date_of_birth') as string) || null,
      parent_id,
      enrollment_parent_cin,
      class_id: (formData.get('class_id') as string) || null,
    })
    .eq('id', studentId)

  if (error) {
    redirect(`/admin/students/edit/${studentId}?error=` + encodeURIComponent(error.message))
  }
  redirect('/admin/students?success=student_updated')
}

export default async function EditStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams
  const supabase = await createClient()

  const [{ data: student }, { data: classes }] = await Promise.all([
    supabase
      .from('students')
      .select(
        `
        *,
        parent:profiles!students_parent_id_fkey(full_name, email, cin)
      `
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('classes').select('id, name, grade_level').order('name'),
  ])

  if (!student) redirect('/admin/students')

  const parentCinDefault =
    (student as { parent?: { cin?: string | null } | null }).parent?.cin ||
    (student as { enrollment_parent_cin?: string | null }).enrollment_parent_cin ||
    ''

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/students" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;élève</h1>
          <p className="text-gray-500 text-sm mt-0.5">{student.full_name}</p>
        </div>
      </div>

      {errorParam && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(errorParam)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form action={handleUpdate} className="space-y-5">
          <input type="hidden" name="student_id" value={student.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              required
              defaultValue={student.full_name}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">N° élève</span>{' '}
            <span className="font-semibold text-gray-900 tabular-nums">{student.student_number || '—'}</span>
            <p className="text-xs text-gray-400 mt-1">
              Géré automatiquement (liste 1 → n). Utilisez « Réorganiser les N° » sur la liste élèves si besoin.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de naissance</label>
            <input
              type="date"
              name="date_of_birth"
              defaultValue={student.date_of_birth || ''}
              className="w-full max-w-xs px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="rounded-lg border-2 border-gray-900 bg-gray-50 p-4">
            <label className="block text-sm font-semibold text-gray-900 mb-1">CIN du parent</label>
            <p className="text-xs text-gray-600 mb-2">
              Compte lié :{' '}
              {(student as { parent?: { full_name?: string; email?: string } | null }).parent ? (
                <span className="font-medium text-gray-800">
                  {(student as { parent: { full_name: string; email: string } }).parent.full_name} —{' '}
                  {(student as { parent: { full_name: string; email: string } }).parent.email}
                </span>
              ) : (
                <span className="text-amber-700">aucun pour l&apos;instant (parent pas encore inscrit ou CIN en attente)</span>
              )}
            </p>
            <input
              type="text"
              name="parent_cin"
              autoComplete="off"
              defaultValue={parentCinDefault}
              placeholder="CIN du titulaire du compte parent"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono uppercase"
            />
            <p className="text-xs text-gray-500 mt-1.5">Laisser vide pour retirer tout lien parent.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Classe</label>
            <select
              name="class_id"
              defaultValue={student.class_id || ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">Aucune classe assignée</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.grade_level ? ` — ${c.grade_level}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <p>
              Créé le : {new Date(student.created_at).toLocaleDateString('fr-FR')} · Mis à jour le :{' '}
              {new Date(student.updated_at).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
            >
              Enregistrer
            </button>
            <Link
              href="/admin/students"
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
