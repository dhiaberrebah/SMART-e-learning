import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

export default async function TeacherStudents({ searchParams }: { searchParams: Promise<{ class_id?: string; q?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const { data: classes } = await db
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user!.id)
    .order('name')

  const classIds = (classes ?? []).map((c: any) => c.id)
  const targetClassIds = sp.class_id ? [sp.class_id] : classIds

  const { data: students } = targetClassIds.length > 0
    ? await db
        .from('students')
        .select('id, full_name, student_number, date_of_birth, class_id, class:classes(name), parent:profiles(full_name)')
        .in('class_id', targetClassIds)
        .order('full_name')
    : Promise.resolve({ data: [] })

  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: attendance } = targetClassIds.length > 0
    ? await db.from('attendance').select('student_id, status').in('class_id', targetClassIds).gte('date', last30)
    : Promise.resolve({ data: [] })

  const filtered = sp.q
    ? (students ?? []).filter((s: any) => s.full_name.toLowerCase().includes(sp.q!.toLowerCase()) || s.student_number?.includes(sp.q))
    : (students ?? [])

  const getRate = (id: string) => {
    const recs = (attendance ?? []).filter((a: any) => a.student_id === id)
    if (!recs.length) return null
    return Math.round((recs.filter((a: any) => a.status === 'present').length / recs.length) * 100)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes élèves</h1>
        <p className="text-gray-500 text-sm mt-1">{(filtered as any[]).length} élève{(filtered as any[]).length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 mb-6">
        <input type="text" name="q" defaultValue={sp.q} placeholder="Rechercher un élève…"
          className="flex-1 border border-gray-400 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <select name="class_id" defaultValue={sp.class_id ?? ''}
          className="border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes les classes</option>
          {(classes as any[] ?? []).map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Filtrer
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Élève</th>
                <th className="px-5 py-3 text-left">N° Matricule</th>
                <th className="px-5 py-3 text-left">Classe</th>
                <th className="px-5 py-3 text-left">Parent</th>
                <th className="px-4 py-3 text-center">Présence 30j</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(filtered as any[]).length > 0 ? (
                (filtered as any[]).map((s) => {
                  const rate = getRate(s.id)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 text-sm">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-700 text-xs font-bold">{s.full_name?.charAt(0)}</span>
                          </div>
                          {s.full_name}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{s.student_number ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-600">{s.class?.name ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-500">{s.parent?.full_name ?? '—'}</td>
                      <td className="px-4 py-4 text-center">
                        {rate !== null ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rate >= 80 ? 'bg-emerald-100 text-emerald-700' : rate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {rate}%
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link href={`/teacher/grades?student_id=${s.id}`} className="text-xs text-blue-600 hover:underline">Voir notes</Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">Aucun élève trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
