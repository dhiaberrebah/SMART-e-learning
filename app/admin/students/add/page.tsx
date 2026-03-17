import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function handleAddStudent(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const { error } = await supabase.from('students').insert({
    full_name: formData.get('full_name') as string,
    date_of_birth: (formData.get('date_of_birth') as string) || null,
    student_number: (formData.get('student_number') as string) || null,
    parent_id: (formData.get('parent_id') as string) || null,
    class_id: (formData.get('class_id') as string) || null,
  })

  if (error) {
    redirect('/admin/students/add?error=' + encodeURIComponent(error.message))
  }
  redirect('/admin/students?success=student_added')
}

export default async function AddStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const [{ data: parents }, { data: classes }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').eq('role', 'parent').order('full_name'),
    supabase.from('classes').select('id, name, grade_level').order('name'),
  ])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/students" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajouter un élève</h1>
          <p className="text-gray-500 text-sm mt-0.5">Inscrire un nouvel élève</p>
        </div>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form action={handleAddStudent} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              required
              placeholder="Nom complet de l'élève"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">N° élève</label>
              <input
                type="text"
                name="student_number"
                placeholder="Ex : 2024001"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de naissance</label>
              <input
                type="date"
                name="date_of_birth"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent</label>
            <select
              name="parent_id"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">Aucun parent assigné</option>
              {parents?.map(p => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — {p.email}
                </option>
              ))}
            </select>
            {(!parents || parents.length === 0) && (
              <p className="text-xs text-amber-600 mt-1">
                Aucun parent dans le système.{' '}
                <Link href="/admin/users/add" className="underline">Ajouter un parent</Link>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Classe</label>
            <select
              name="class_id"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">Aucune classe assignée</option>
              {classes?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.grade_level ? ` — ${c.grade_level}` : ''}
                </option>
              ))}
            </select>
            {(!classes || classes.length === 0) && (
              <p className="text-xs text-amber-600 mt-1">
                Aucune classe disponible.{' '}
                <Link href="/admin/classes/add" className="underline">Créer une classe</Link>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
              Ajouter l&apos;élève
            </button>
            <Link href="/admin/students" className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
