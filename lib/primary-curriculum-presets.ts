/** Préréglages de programme — enseignement primaire (Tunisie), noms usuels des matières. */

export const PRIMARY_CURRICULUM_PRESET_TUNISIA: readonly string[] = [
  'Arabe',
  'Français',
  'Mathématiques',
  'Anglais',
  'Découverte',
  'Activités scientifiques',
  'Éducation islamique',
  'Éducation artistique',
  'Éducation musicale',
  'Éducation physique et sportive',
  'Informatique',
] as const

export const CURRICULUM_PRESET_LABELS: Record<string, { label: string; names: readonly string[] }> = {
  tunisia_primary: {
    label: 'Programme primaire (Tunisie) — toutes les matières listées',
    names: PRIMARY_CURRICULUM_PRESET_TUNISIA,
  },
  tunisia_core: {
    label: 'Socle : Arabe, Français, Maths, Anglais',
    names: ['Arabe', 'Français', 'Mathématiques', 'Anglais'],
  },
}
