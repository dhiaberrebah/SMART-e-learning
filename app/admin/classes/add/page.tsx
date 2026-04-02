import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  buildAutoClassName,
  classNameExistsGlobally,
  nextClassSectionLetter,
} from '@/lib/class-name'
import { PRIMARY_GRADE_OPTIONS_TUNISIA } from '@/lib/grade-levels'

async function handleAddClass(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const grade_level = ((formData.get('grade_level') as string) || '').trim()
  const academic_year = ((formData.get('academic_year') as string) || '').trim() || null

  if (!grade_level) {
    redirect(
      '/admin/classes/add?error=' +
        encodeURIComponent('Le niveau scolaire est obligatoire : le nom de la classe sera généré automatiquement (ex. 1re année a).')
    )
  }

  const { data: sameLevelRows, error: fetchErr } = await supabase
    .from('classes')
    .select('name, academic_year')
    .eq('grade_level', grade_level)

  if (fetchErr) {
    redirect('/admin/classes/add?error=' + encodeURIComponent(fetchErr.message))
  }

  const siblings = (sameLevelRows ?? []).filter(
    (r) => (r.academic_year || '') === (academic_year || '')
  )
  const siblingNames = siblings.map((r) => r.name)

  const letter = nextClassSectionLetter(grade_level, siblingNames)
  if (!letter) {
    redirect(
      '/admin/classes/add?error=' +
        encodeURIComponent('Nombre maximum de sections atteint pour ce niveau (a–z).')
    )
  }

  const name = buildAutoClassName(grade_level, letter)

  const { data: allRows } = await supabase.from('classes').select('name')
  const taken = new Set((allRows ?? []).map((r) => r.name.trim().toLowerCase()))
  if (classNameExistsGlobally(name, taken)) {
    redirect(
      '/admin/classes/add?error=' +
        encodeURIComponent('Ce nom de classe existe déjà. Réessayez ou contactez le support.')
    )
  }

  const { error } = await supabase.from('classes').insert({
    name,
    description: (formData.get('description') as string) || null,
    grade_level,
    academic_year,
    teacher_id: (formData.get('teacher_id') as string) || null,
  })

  if (error) {
    if (error.code === '23505' || error.message.toLowerCase().includes('unique')) {
      redirect(
        '/admin/classes/add?error=' +
          encodeURIComponent('Un nom de classe identique existe déjà (contrainte d’unicité).')
      )
    }
    redirect('/admin/classes/add?error=' + encodeURIComponent(error.message))
  }
  redirect('/admin/classes?success=class_added')
}

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

  const gradeOptions = [...PRIMARY_GRADE_OPTIONS_TUNISIA]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/classes" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer une classe</h1>
          <p className="text-gray-500 text-sm mt-0.5">Nouvelle classe scolaire</p>
        </div>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form action={handleAddClass} className="space-y-5">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
            <p className="font-medium">Nom attribué automatiquement</p>
            <p className="mt-1 text-indigo-800/90">
              Format : <strong>niveau</strong> + lettre de section <strong>a</strong>, <strong>b</strong>, <strong>c</strong>… (ex.{' '}
              <span className="font-mono text-xs bg-white/80 px-1.5 py-0.5 rounded">1re année a</span>, puis{' '}
              <span className="font-mono text-xs bg-white/80 px-1.5 py-0.5 rounded">1re année b</span>). Même niveau et même année
              scolaire : la prochaine lettre libre est choisie. Les doublons sont interdits.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Brève description de la classe"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Niveau scolaire <span className="text-red-500">*</span>
              </label>
              <select
                name="grade_level"
                required
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Choisir un niveau</option>
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Année scolaire</label>
              <input
                type="text"
                name="academic_year"
                placeholder="Ex : 2024-2025"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Enseignant responsable</label>
            <select
              name="teacher_id"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">Aucun enseignant assigné</option>
              {teachers?.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
            {(!teachers || teachers.length === 0) && (
              <p className="text-xs text-amber-600 mt-1">
                Aucun enseignant disponible.{' '}
                <Link href="/admin/users/add" className="underline">Ajouter un enseignant</Link>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
              Créer la classe
            </button>
            <Link href="/admin/classes" className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
