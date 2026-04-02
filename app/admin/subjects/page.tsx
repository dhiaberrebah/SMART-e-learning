import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('subjects')
    .select(
      `id, name, description, class_id, teacher_id,
       class:classes(name, grade_level),
       teacher:profiles!subjects_teacher_id_fkey(full_name)`
    )
    .order('name')

  const successMsg: Record<string, string> = {
    subject_deleted: 'Matière supprimée.',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matières</h1>
          <p className="text-gray-500 text-sm mt-1">Création et attribution par classe et enseignant</p>
        </div>
        <Link
          href="/admin/subjects/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm text-center"
        >
          + Nouvelle matière
        </Link>
      </div>

      {sp.success && successMsg[sp.success] && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">
          {successMsg[sp.success]}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-100">
                <th className="px-4 py-3">Matière</th>
                <th className="px-4 py-3">Classe</th>
                <th className="px-4 py-3">Enseignant</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(rows ?? []).length > 0 ? (
                (rows as any[]).map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      {s.description ? (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{s.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.class?.name ?? '—'}
                      {s.class?.grade_level ? (
                        <span className="text-gray-400 text-xs ml-1">({s.class.grade_level})</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.teacher?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/admin/classes/${s.class_id}`} className="text-indigo-600 hover:underline mr-3">
                        Classe
                      </Link>
                      <Link href={`/admin/subjects/edit/${s.id}`} className="text-gray-700 hover:underline font-medium">
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    Aucune matière.{' '}
                    <Link href="/admin/subjects/add" className="text-indigo-600 font-medium hover:underline">
                      En créer une
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
