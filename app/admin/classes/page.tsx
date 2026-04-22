import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PRIMARY_GRADE_OPTIONS_TUNISIA } from '@/lib/grade-levels'

function classHasAssignedTeacher(c: any): boolean {
  if (c.teacher_id != null) return true
  return (c.subjects ?? []).some((s: any) => s.teacher_id != null)
}

function classMatchesTeacherFilter(c: any, teacherId: string): boolean {
  if (c.teacher_id === teacherId) return true
  return (c.subjects ?? []).some((s: any) => s.teacher_id === teacherId)
}

function classTeacherDisplayNames(c: any): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  if (c.teacher_id && c.teacher?.full_name) {
    seen.add(c.teacher_id)
    names.push(c.teacher.full_name)
  }
  for (const s of c.subjects ?? []) {
    const id = s.teacher_id
    const n = s.teacher?.full_name
    if (id && n && !seen.has(id)) {
      seen.add(id)
      names.push(n)
    }
  }
  return names
}

function applyClassFilters(rows: any[], teacher: string, niveau: string) {
  let list = rows
  if (teacher === 'none') list = list.filter((c) => !classHasAssignedTeacher(c))
  else if (teacher) list = list.filter((c) => classMatchesTeacherFilter(c, teacher))
  if (niveau === '__none__') {
    list = list.filter((c) => !(c.grade_level && String(c.grade_level).trim()))
  } else if (niveau) {
    list = list.filter((c) => (c.grade_level || '') === niveau)
  }
  return list
}

function buildClassesListUrl(params: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  if (params.success) q.set('success', params.success)
  if (params.teacher) q.set('teacher', params.teacher)
  if (params.niveau) q.set('niveau', params.niveau)
  const s = q.toString()
  return s ? `/admin/classes?${s}` : '/admin/classes'
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; teacher?: string; niveau?: string }>
}) {
  const sp = await searchParams
  const teacherFilter = sp.teacher || ''
  const niveauFilter = sp.niveau || ''

  const supabase = await createClient()

  const [{ data: allRows }, { data: teachers }] = await Promise.all([
    supabase
      .from('classes')
      .select(
        `
      *,
      teacher:profiles!classes_teacher_id_fkey(full_name),
      students(count),
      subjects(
        teacher_id,
        teacher:profiles!subjects_teacher_id_fkey(full_name)
      )
    `
      )
      .order('name', { ascending: true }),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher').order('full_name'),
  ])

  const allClasses = allRows ?? []
  const classes = applyClassFilters(allClasses, teacherFilter, niveauFilter)

  const baseNiveaux = [...PRIMARY_GRADE_OPTIONS_TUNISIA] as string[]
  const fromDb = [
    ...new Set(
      allClasses
        .map((c) => c.grade_level)
        .filter((g): g is string => Boolean(g && String(g).trim()))
    ),
  ]
  const niveauOptions = [...baseNiveaux]
  for (const g of fromDb) {
    if (!niveauOptions.includes(g)) niveauOptions.push(g)
  }

  const totalStudents =
    classes.reduce((sum, c) => sum + ((c.students as any)?.[0]?.count || 0), 0) || 0

  const assignedInView = classes.filter((c) => classHasAssignedTeacher(c)).length
  const hasActiveFilters = Boolean(teacherFilter || niveauFilter)

  const successMessages: Record<string, string> = {
    class_added: 'Classe créée avec succès.',
    class_updated: 'Classe mise à jour.',
    class_deleted: 'Classe supprimée.',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">Gestion des classes et des matières</p>
        </div>
        <Link href="/admin/classes/add" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm text-center sm:text-left shrink-0">
          + Ajouter une classe
        </Link>
      </div>

      {sp.success && successMessages[sp.success] && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">
          {successMessages[sp.success]}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filtres avancés</p>
        <form method="get" className="flex flex-col lg:flex-row lg:items-end gap-4">
          {sp.success ? <input type="hidden" name="success" value={sp.success} /> : null}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="filter-teacher" className="block text-sm font-medium text-gray-700 mb-1">
              Enseignant responsable
            </label>
            <select
              id="filter-teacher"
              name="teacher"
              defaultValue={teacherFilter}
              className="w-full px-3 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">Tous les enseignants</option>
              <option value="none">Sans enseignant assigné</option>
              {teachers?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="filter-niveau" className="block text-sm font-medium text-gray-700 mb-1">
              Niveau de classe
            </label>
            <select
              id="filter-niveau"
              name="niveau"
              defaultValue={niveauFilter}
              className="w-full px-3 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">Tous les niveaux</option>
              <option value="__none__">Sans niveau renseigné</option>
              {niveauOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Appliquer
            </button>
            {hasActiveFilters ? (
              <Link
                href={sp.success ? buildClassesListUrl({ success: sp.success }) : '/admin/classes'}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium inline-flex items-center justify-center"
              >
                Réinitialiser filtres
              </Link>
            ) : null}
          </div>
        </form>
        {hasActiveFilters && (
          <p className="text-xs text-gray-500 mt-3">
            Affichage filtré : <strong>{classes.length}</strong> classe(s) sur {allClasses.length}.
          </p>
        )}
      </div>

      {/* Stats (selon le filtre actif) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">{hasActiveFilters ? 'Classes (filtre)' : 'Total classes'}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{classes.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Avec enseignant (résultat)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{assignedInView}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Élèves (résultat)</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalStudents}</p>
        </div>
      </div>

      {classes && classes.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Liste des classes</h2>
            <span className="text-xs text-gray-500">{classes.length} entrée(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-3">Classe</th>
                  <th className="px-4 py-3 whitespace-nowrap">Niveau</th>
                  <th className="px-4 py-3 whitespace-nowrap">Année scol.</th>
                  <th className="px-4 py-3 min-w-[200px] max-w-[280px]">Enseignants</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Élèves</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classes.map((cls: any) => {
                  const teacherNames = classTeacherDisplayNames(cls)
                  return (
                  <tr key={cls.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-gray-900">{cls.name}</p>
                      {cls.description ? (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 max-w-md">{cls.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      {cls.grade_level ? (
                        <span className="inline-flex text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-medium">
                          {cls.grade_level}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-600 whitespace-nowrap">
                      {cls.academic_year || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700 max-w-[280px]">
                      {teacherNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {teacherNames.map((name, idx) => (
                            <span
                              key={`${cls.id}-${idx}-${name}`}
                              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/90 py-0.5 pl-0.5 pr-2 text-xs font-medium text-slate-800 shadow-sm"
                            >
                              <span
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold uppercase tracking-tight text-emerald-700 ring-1 ring-slate-200/80"
                                aria-hidden
                              >
                                {name.trim().charAt(0) || '?'}
                              </span>
                              <span className="truncate">{name.trim()}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-1 text-[11px] font-medium text-amber-800">
                          Non assigné
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-center font-medium text-gray-900 tabular-nums">
                      {cls.students?.[0]?.count ?? 0}
                    </td>
                    <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                      <Link
                        href={`/admin/classes/${cls.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium mr-3"
                      >
                        Détails
                      </Link>
                      <Link
                        href={`/admin/classes/edit/${cls.id}`}
                        className="text-gray-600 hover:text-gray-900 font-medium"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : allClasses.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-amber-100">
          <p className="text-sm text-amber-800 font-medium">Aucune classe ne correspond aux filtres.</p>
          <p className="mt-1 text-sm text-gray-500">Modifiez les critères ou réinitialisez.</p>
          <Link
            href={sp.success ? buildClassesListUrl({ success: sp.success }) : '/admin/classes'}
            className="mt-4 inline-block px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Réinitialiser les filtres
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-3 text-sm font-medium text-gray-700">Aucune classe</h3>
          <p className="mt-1 text-sm text-gray-400">Commencez par créer une nouvelle classe</p>
          <Link href="/admin/classes/add" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            + Créer une classe
          </Link>
        </div>
      )}
    </div>
  )
}
