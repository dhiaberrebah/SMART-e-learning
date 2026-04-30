/** Génère le nom de classe « niveau + section » (a, b, c, …). La lettre est la prochaine disponible pour le niveau dans toute la base. */

export function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Prochaine lettre de section (a–z) pour ce niveau : tous les noms au format « {niveau} x » (toutes années) sont pris en compte. */
export function nextClassSectionLetter(gradeLevel: string, existingNames: string[]): string | null {
  const gl = gradeLevel.trim()
  if (!gl) return null
  const prefix = `${gl} `
  const re = new RegExp(`^${escapeRegExp(prefix)}([a-z])$`, 'i')
  const used = new Set<string>()
  for (const raw of existingNames) {
    const n = raw.trim()
    const m = n.match(re)
    if (m) used.add(m[1].toLowerCase())
  }
  for (let i = 0; i < 26; i++) {
    const c = String.fromCharCode(97 + i)
    if (!used.has(c)) return c
  }
  return null
}

export function buildAutoClassName(gradeLevel: string, letter: string) {
  return `${gradeLevel.trim()} ${letter.toLowerCase()}`
}

/** Clé d'année alignée avec l'index unique SQL (vide = années non renseignées traitées comme la même coupe). */
export function normalizeAcademicYearKey(year: string | null | undefined): string {
  return (year ?? '').trim()
}

/** Conflit de nom pour la même année scolaire (cohérent avec idx_classes_name_academic_year_lower). */
export function classNameTakenForSameYear(
  name: string,
  academicYear: string | null | undefined,
  rows: { name: string; academic_year?: string | null }[]
): boolean {
  const nameLc = name.trim().toLowerCase()
  const y = normalizeAcademicYearKey(academicYear)
  return rows.some((r) => r.name.trim().toLowerCase() === nameLc && normalizeAcademicYearKey(r.academic_year) === y)
}
