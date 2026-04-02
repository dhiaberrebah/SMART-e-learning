import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { renumberStudentsSequential } from '@/lib/student-numbers'

async function renumberAllStudents() {
  'use server'
  const supabase = await createClient()
  await renumberStudentsSequential(supabase)
  redirect('/admin/students?success=renumbered')
}

function sortStudentsByNumber<T extends { student_number?: string | null; full_name?: string | null }>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const na = parseInt(String(a.student_number ?? '').trim(), 10)
    const nb = parseInt(String(b.student_number ?? '').trim(), 10)
    const aNum = Number.isFinite(na)
    const bNum = Number.isFinite(nb)
    if (aNum && bNum && na !== nb) return na - nb
    if (aNum && !bNum) return -1
    if (!aNum && bNum) return 1
    return (a.full_name || '').localeCompare(b.full_name || '', 'fr')
  })
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: studentsRaw } = await supabase
    .from('students')
    .select(
      `
      *,
      parent:profiles!students_parent_id_fkey(full_name, email),
      class:classes(name, grade_level)
    `
    )

  const students = sortStudentsByNumber(studentsRaw ?? [])

  const withClass = students.filter((s) => s.class_id).length || 0
  const withoutClass = students.filter((s) => !s.class_id).length || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          <p className="text-gray-500 mt-1">Gestion de tous les élèves de l&apos;école</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action={renumberAllStudents}>
            <button
              type="submit"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
              title="Réattribue les numéros de 1 à n selon la date d&apos;inscription"
            >
              Réorganiser les N° (1 → n)
            </button>
          </form>
          <Link
            href="/admin/students/add"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm text-center"
          >
            + Ajouter un élève
          </Link>
        </div>
      </div>

      {sp.success === 'student_added' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Élève ajouté
        </div>
      )}
      {sp.success === 'student_updated' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Élève mis à jour
        </div>
      )}
      {sp.success === 'student_deleted' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Élève supprimé — numéros réorganisés
        </div>
      )}
      {sp.success === 'renumbered' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Numéros réorganisés de 1 à {students.length}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total élèves</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Inscrits en classe</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{withClass}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Sans classe</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{withoutClass}</p>
        </div>
      </div>

      {students.length > 0 ? (
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['N° élève', 'Nom', 'Date de naissance', 'Classe', 'Parent', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 tabular-nums whitespace-nowrap">
                    {s.student_number || '—'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-700 text-xs font-bold">{s.full_name?.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {s.class ? (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        {s.class.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Non inscrit</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap max-w-[220px]">
                    {s.parent?.full_name ? (
                      <div>
                        <span className="font-medium text-gray-800">{s.parent.full_name}</span>
                        <span className="block text-xs text-gray-400 truncate">{s.parent.email}</span>
                      </div>
                    ) : (s as { enrollment_parent_cin?: string | null }).enrollment_parent_cin ? (
                      <span className="text-xs text-amber-700 font-medium leading-snug">
                        En attente : parent pas encore inscrit
                        <span className="block font-mono text-gray-600 mt-0.5">
                          CIN {(s as { enrollment_parent_cin: string }).enrollment_parent_cin}
                        </span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm font-medium flex gap-3">
                    <Link href={`/admin/students/edit/${s.id}`} className="text-indigo-600 hover:text-indigo-800">
                      Modifier
                    </Link>
                    <Link href={`/admin/students/delete/${s.id}`} className="text-red-500 hover:text-red-700">
                      Supprimer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            />
          </svg>
          <h3 className="mt-3 text-sm font-medium text-gray-700">Aucun élève</h3>
          <p className="mt-1 text-sm text-gray-400">Commencez par ajouter un nouvel élève</p>
          <Link
            href="/admin/students/add"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            + Ajouter un élève
          </Link>
        </div>
      )}
    </div>
  )
}
