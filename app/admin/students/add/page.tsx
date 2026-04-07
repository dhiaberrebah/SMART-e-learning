import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { nextStudentNumber } from '@/lib/student-numbers'
import { normalizeParentCin } from '@/lib/parent-cin'

const MIN_STUDENT_AGE = 5

/** Dernière date de naissance autorisée (aujourd'hui − N ans). */
function maxDateOfBirthString(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_STUDENT_AGE)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

function isAtLeastAge(dobStr: string, years: number): boolean {
  const parts = dobStr.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return false
  const [Y, M, D] = parts
  const birth = new Date(Y, M - 1, D)
  if (Number.isNaN(birth.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const md = today.getMonth() - birth.getMonth()
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--
  return age >= years
}

async function handleAddStudent(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const num = await nextStudentNumber(supabase)

  const dobRaw = (formData.get('date_of_birth') as string)?.trim()
  if (dobRaw && !isAtLeastAge(dobRaw, MIN_STUDENT_AGE)) {
    redirect(
      '/admin/students/add?error=' +
        encodeURIComponent(`L'élève doit avoir au moins ${MIN_STUDENT_AGE} ans.`)
    )
  }

  const parentCinNorm = normalizeParentCin(formData.get('parent_cin') as string)
  if (!parentCinNorm) {
    redirect('/admin/students/add?error=' + encodeURIComponent("Le CIN du parent est obligatoire pour lier l'élève au compte parent."))
  }

  const { data: par } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'parent')
    .eq('cin', parentCinNorm)
    .maybeSingle()

  const parent_id = par?.id ?? null
  const enrollment_parent_cin = par ? null : parentCinNorm

  const { error } = await supabase.from('students').insert({
    full_name: formData.get('full_name') as string,
    date_of_birth: dobRaw || null,
    student_number: String(num),
    parent_id,
    enrollment_parent_cin,
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
  const [{ data: classes }, nextNum] = await Promise.all([
    supabase.from('classes').select('id, name, grade_level').order('name'),
    nextStudentNumber(supabase),
  ])

  const maxDob = maxDateOfBirthString()

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
          <p className="text-gray-500 text-sm mt-0.5">Inscrire un nouvel élève et le rattacher au parent par CIN</p>
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

          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-900">
            <span className="font-medium">N° élève :</span>{' '}
            <span className="tabular-nums font-bold">{nextNum}</span>
            <span className="text-indigo-700/80">
              {' '}
              (attribué à l'enregistrement ; peut être le suivant si un autre élève est créé entre-temps)
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de naissance</label>
            <input
              type="date"
              name="date_of_birth"
              max={maxDob}
              className="w-full max-w-xs px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              L&apos;élève doit avoir au moins {MIN_STUDENT_AGE} ans (date de naissance au plus tard le{' '}
              {new Date(maxDob + 'T12:00:00').toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              ).
            </p>
          </div>

          <div className="rounded-lg border-2 border-gray-900 bg-gray-50 p-4">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              CIN du parent <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Identique au CIN indiqué par le parent à l'inscription. Si le compte parent existe déjà, l'élève est lié
              tout de suite. Sinon, le lien se fera automatiquement dès que le parent créera son compte avec ce CIN.
            </p>
            <input
              type="text"
              name="parent_cin"
              required
              autoComplete="off"
              placeholder="Ex. 12345678"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Classe</label>
            <select
              name="class_id"
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
            {(!classes || classes.length === 0) && (
              <p className="text-xs text-amber-600 mt-1">
                Aucune classe disponible.{' '}
                <Link href="/admin/classes/add" className="underline">
                  Créer une classe
                </Link>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
            >
              Ajouter l&apos;élève
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
