export const TIME_SLOTS = [
  { index: 0, label: '08:00 – 09:00', start: '08:00', end: '09:00' },
  { index: 1, label: '09:00 – 10:00', start: '09:00', end: '10:00' },
  { index: 2, label: '10:00 – 11:00', start: '10:00', end: '11:00' },
  { index: 3, label: '11:00 – 12:00', start: '11:00', end: '12:00' },
  { index: 4, label: '14:00 – 15:00', start: '14:00', end: '15:00' },
  { index: 5, label: '15:00 – 16:00', start: '15:00', end: '16:00' },
  { index: 6, label: '16:00 – 17:00', start: '16:00', end: '17:00' },
  { index: 7, label: '17:00 – 18:00', start: '17:00', end: '18:00' },
] as const

export const DAYS_OF_WEEK = [
  { index: 1, label: 'Lundi',    short: 'Lun' },
  { index: 2, label: 'Mardi',    short: 'Mar' },
  { index: 3, label: 'Mercredi', short: 'Mer' },
  { index: 4, label: 'Jeudi',    short: 'Jeu' },
  { index: 5, label: 'Vendredi', short: 'Ven' },
  { index: 6, label: 'Samedi',   short: 'Sam' },
] as const

export type TimetableSlot = {
  id: string
  class_id: string
  teacher_id: string | null
  subject_name: string
  day_of_week: number
  slot_index: number
  room: string | null
  teacher?: { full_name: string | null } | null
  class?: { name: string } | null
}

/** Palette de couleurs pour les matières (rotation par hash simple) */
const SUBJECT_COLORS = [
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-rose-100 border-rose-300 text-rose-800',
  'bg-sky-100 border-sky-300 text-sky-800',
  'bg-violet-100 border-violet-300 text-violet-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-teal-100 border-teal-300 text-teal-800',
]

export function subjectColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length]
}
