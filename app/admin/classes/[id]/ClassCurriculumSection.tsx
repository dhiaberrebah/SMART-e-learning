import Link from 'next/link'
import { CURRICULUM_PRESET_LABELS } from '@/lib/primary-curriculum-presets'
import { applyCurriculumPreset, removeCurriculumItem } from './curriculum-actions'

type Item = { id: string; name: string; sort_order: number }

function norm(s: string) {
  return s.trim().toLowerCase()
}

export default function ClassCurriculumSection({
  classId,
  items,
  subjectNames,
}: {
  classId: string
  items: Item[]
  subjectNames: string[]
}) {
  const subjectLower = new Set(subjectNames.map((n) => norm(n)))

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-slate-50/80">
        <h2 className="font-semibold text-gray-900">Programme prévu (référentiel)</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-3xl">
          Définissez les matières qui doivent être enseignées dans cette classe. Cela sert de guide pour créer les
          matières réelles (enseignant + créneaux) et repérer les écarts.
        </p>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Préréglages</p>
          <div className="flex flex-col gap-2">
            {Object.entries(CURRICULUM_PRESET_LABELS).map(([key, { label }]) => (
              <form key={key} action={applyCurriculumPreset}>
                <input type="hidden" name="class_id" value={classId} />
                <input type="hidden" name="preset_key" value={key} />
                <button
                  type="submit"
                  className="w-full text-left px-3 py-2 rounded-lg border border-indigo-100 bg-indigo-50/50 text-sm text-indigo-900 hover:bg-indigo-50 transition-colors"
                >
                  {label}
                </button>
              </form>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Les matières déjà listées ne sont pas dupliquées.</p>

          {items.length > 0 ? (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Matières du programme</p>
              <ul className="space-y-2">
                {items
                  .slice()
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
                  .map((row) => {
                    const covered = subjectLower.has(norm(row.name))
                    return (
                      <li
                        key={row.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`shrink-0 w-2 h-2 rounded-full ${covered ? 'bg-emerald-500' : 'bg-amber-400'}`}
                            title={covered ? 'Matière créée pour la classe' : 'Pas encore de matière avec ce nom'}
                          />
                          <span className="font-medium text-gray-900 truncate">{row.name}</span>
                        </div>
                        <form action={removeCurriculumItem} className="shrink-0">
                          <input type="hidden" name="class_id" value={classId} />
                          <input type="hidden" name="item_id" value={row.id} />
                          <button
                            type="submit"
                            className="text-xs text-red-600 hover:text-red-800 hover:underline"
                          >
                            Retirer
                          </button>
                        </form>
                      </li>
                    )
                  })}
              </ul>
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Couverture (prévu → matières créées)</h3>
          <p className="text-xs text-gray-500 mb-3">
            Correspondance par nom (insensible à la casse). Créez les matières via{' '}
            <Link href={`/admin/subjects/add?class_id=${classId}`} className="text-indigo-600 hover:underline">
              + Ajouter une matière
            </Link>
            .
          </p>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400">Appliquez un préréglage à gauche pour remplir le programme.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {items
                .slice()
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
                .map((row) => {
                  const covered = subjectLower.has(norm(row.name))
                  return (
                    <li
                      key={row.id}
                      className={`rounded-lg px-3 py-2 border ${covered ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/40'}`}
                    >
                      <span className="font-medium text-gray-900">{row.name}</span>
                      <span className={`ml-2 text-xs ${covered ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {covered ? '✓ Matière créée' : '⚠ À créer / nom différent'}
                      </span>
                    </li>
                  )
                })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
