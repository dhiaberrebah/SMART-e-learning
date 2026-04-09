/** Aligné sur le web : CIN sans espaces, majuscules */
export function normalizeParentCin(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const s = String(raw).trim().replace(/\s+/g, '')
  if (!s) return null
  return s.toUpperCase()
}
