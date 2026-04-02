import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

async function handleUpdate(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('subject_id') as string
  const name = ((formData.get('name') as string) || '').trim()
  const classId = (formData.get('class_id') as string) || ''
  const teacherId = (formData.get('teacher_id') as string) || ''
  const description = ((formData.get('description') as string) || '').trim() || null

  if (!name || !classId || !teacherId) {
    redirect(`/admin/subjects/edit/${id}?error=missing`)
  }

  const { error } = await supabase
    .from('subjects')
    .update({
      name,
      class_id: classId,
      teacher_id: teacherId,
      description,
    })
    .eq('id', id)

  if (error) {
    redirect(`/admin/subjects/edit/${id}?error=` + encodeURIComponent(error.message))
  }
  redirect(`/admin/classes/${classId}?success=subject_updated`)
}

async function handleDelete(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('subject_id') as string
  const classId = formData.get('return_class_id') as string

  await supabase.from('subjects').delete().eq('id', id)
  if (classId) {
    redirect(`/admin/classes/${classId}?success=subject_deleted`)
  }
  redirect('/admin/subjects?success=subject_deleted')
}

export default async function AdminEditSubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errParam } = await searchParams
  const supabase = await createClient()

  const [{ data: sub }, { data: classes }, { data: teachers }] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', id).maybeSingle(),
    supabase.from('classes').select('id, name, grade_level').order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher').order('full_name'),
  ])

  if (!sub) notFound()

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/admin/classes/${sub.class_id}`} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier la matière</h1>
          <p className="text-gray-500 text-sm mt-0.5">{sub.name}</p>
        </div>
      </div>

      {errParam && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errParam === 'missing' ? 'Champs obligatoires manquants.' : decodeURIComponent(errParam)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
        <form action={handleUpdate} className="space-y-5">
          <input type="hidden" name="subject_id" value={sub.id} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={sub.name}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Classe <span className="text-red-500">*</span>
            </label>
            <select
              name="class_id"
              required
              defaultValue={sub.class_id || ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {(classes ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.grade_level ? ` · ${c.grade_level}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Enseignant <span className="text-red-500">*</span>
            </label>
            <select
              name="teacher_id"
              required
              defaultValue={sub.teacher_id || ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">—</option>
              {(teachers ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={sub.description || ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
              Enregistrer
            </button>
            <Link
              href={`/admin/classes/${sub.class_id}`}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
        <h2 className="text-sm font-semibold text-red-700 mb-2">Supprimer cette matière</h2>
        <p className="text-xs text-gray-500 mb-3">Les notes liées seront supprimées (cascade).</p>
        <form action={handleDelete}>
          <input type="hidden" name="subject_id" value={sub.id} />
          <input type="hidden" name="return_class_id" value={sub.class_id || ''} />
          <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
            Supprimer
          </button>
        </form>
      </div>
    </div>
  )
}
