import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'

async function addSubject(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const name = formData.get('name') as string
  const classId = formData.get('class_id') as string
  const description = formData.get('description') as string

  if (!name || !classId) redirect('/teacher/subjects/add?error=missing')

  const { error } = await db.from('subjects').insert({
    name,
    class_id: classId,
    teacher_id: user.id,
    description: description || null,
  })

  if (error) redirect(`/teacher/subjects/add?error=${encodeURIComponent(error.message)}`)
  redirect('/teacher/subjects')
}

export default async function AddSubjectPage({ searchParams }: { searchParams: Promise<{ class_id?: string; error?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const { data: classes } = await db.from('classes').select('id, name').eq('teacher_id', user!.id).order('name')

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <a href="/teacher/subjects" className="text-sm text-blue-600 hover:underline">← Matières</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nouvelle matière</h1>
      </div>

      {sp.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ❌ {sp.error === 'missing' ? 'Veuillez remplir tous les champs obligatoires.' : sp.error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form action={addSubject} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de la matière <span className="text-red-500">*</span></label>
            <input type="text" name="name" required placeholder="ex: Mathématiques, Français…"
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Classe <span className="text-red-500">*</span></label>
            <select name="class_id" required defaultValue={sp.class_id ?? ''}
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Sélectionner une classe</option>
              {(classes as any[] ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" rows={3} placeholder="Programme, objectifs…"
              className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Créer la matière
            </button>
            <a href="/teacher/subjects" className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Annuler
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
