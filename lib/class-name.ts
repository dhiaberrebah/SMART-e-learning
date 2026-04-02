/** Génère le nom de classe « niveau + section » (a, b, c, …) sans doublon pour le même niveau / année. */

export function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Prochaine lettre de section disponible (a–z) pour ce niveau, d’après les noms existants au format « {niveau} x ». */
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

export function classNameExistsGlobally(name: string, existingLowerNames: Set<string>) {
  return existingLowerNames.has(name.trim().toLowerCase())
}
