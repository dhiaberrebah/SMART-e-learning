import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function handleAddSubject(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const name = ((formData.get('name') as string) || '').trim()
  const classId = (formData.get('class_id') as string) || ''
  const teacherId = (formData.get('teacher_id') as string) || ''
  const description = ((formData.get('description') as string) || '').trim() || null

  if (!name || !classId || !teacherId) {
    redirect('/admin/subjects/add?error=missing')
  }

  const { error } = await supabase.from('subjects').insert({
    name,
    class_id: classId,
    teacher_id: teacherId,
    description,
  })

  if (error) {
    redirect('/admin/subjects/add?error=' + encodeURIComponent(error.message))
  }

  redirect(`/admin/classes/${classId}?success=subject_added`)
}

export default async function AdminAddSubjectPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; error?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: classes }, { data: teachers }] = await Promise.all([
    supabase.from('classes').select('id, name, grade_level').order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher').order('full_name'),
  ])

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href={sp.class_id ? `/admin/classes/${sp.class_id}` : '/admin/subjects'} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle matière</h1>
          <p className="text-gray-500 text-sm mt-0.5">Rattachée à une classe et un enseignant</p>
        </div>
      </div>

      {sp.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {sp.error === 'missing' ? 'Nom, classe et enseignant sont obligatoires.' : decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form action={handleAddSubject} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom de la matière <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex. Mathématiques, Français…"
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
              defaultValue={sp.class_id ?? ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Sélectionner une classe</option>
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
              Enseignant assigné <span className="text-red-500">*</span>
            </label>
            <select
              name="teacher_id"
              required
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Sélectionner un enseignant</option>
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
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Optionnel"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
              Créer la matière
            </button>
            <Link
              href={sp.class_id ? `/admin/classes/${sp.class_id}` : '/admin/subjects'}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
