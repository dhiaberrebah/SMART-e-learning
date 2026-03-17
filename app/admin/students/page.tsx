import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('students')
    .select(`
      *,
      parent:profiles!students_parent_id_fkey(full_name, email),
      class:classes(name, grade_level)
    `)
    .order('full_name', { ascending: true })

  const withClass = students?.filter(s => s.class_id).length || 0
  const withoutClass = students?.filter(s => !s.class_id).length || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          <p className="text-gray-500 mt-1">Gestion de tous les élèves de l&apos;école</p>
        </div>
        <Link
          href="/admin/students/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          + Ajouter un élève
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total élèves</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{students?.length || 0}</p>
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

      {students && students.length > 0 ? (
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Nom', 'N° élève', 'Date de naissance', 'Classe', 'Parent', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-700 text-xs font-bold">{s.full_name?.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {s.student_number || '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {s.date_of_birth
                      ? new Date(s.date_of_birth).toLocaleDateString('fr-FR')
                      : '—'}
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
                  <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {s.parent?.full_name || '—'}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <h3 className="mt-3 text-sm font-medium text-gray-700">Aucun élève</h3>
          <p className="mt-1 text-sm text-gray-400">Commencez par ajouter un nouvel élève</p>
          <Link href="/admin/students/add" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            + Ajouter un élève
          </Link>
        </div>
      )}
    </div>
  )
}
