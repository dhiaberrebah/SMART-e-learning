'use client'

import { useState, useTransition } from 'react'
import { DAYS_OF_WEEK, TIME_SLOTS, TimetableSlot, subjectColor } from '@/lib/timetable'

interface Props {
  mode: 'class' | 'teacher'
  classId?: string
  slots: TimetableSlot[]
  teachers: { id: string; full_name: string | null }[]
  subjects: string[]
  addSlot?: (formData: FormData) => Promise<void>
  deleteSlot?: (id: string, classId: string) => Promise<void>
}

type ModalState = {
  day: number
  slotIdx: number
} | null

export function TimetableGrid({
  mode,
  classId,
  slots,
  teachers,
  subjects,
  addSlot,
  deleteSlot,
}: Props) {
  const [modal, setModal] = useState<ModalState>(null)
  const [subjectInput, setSubjectInput] = useState('')
  const [teacherInput, setTeacherInput] = useState('')
  const [roomInput, setRoomInput] = useState('')
  const [isPending, startTransition] = useTransition()

  const slotMap = new Map<string, TimetableSlot>()
  slots.forEach((s) => slotMap.set(`${s.day_of_week}-${s.slot_index}`, s))

  function openModal(day: number, slotIdx: number) {
    setSubjectInput('')
    setTeacherInput('')
    setRoomInput('')
    setModal({ day, slotIdx })
  }

  function closeModal() {
    setModal(null)
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!addSlot || !classId || !modal) return
    const fd = new FormData()
    fd.append('class_id', classId)
    fd.append('day_of_week', String(modal.day))
    fd.append('slot_index', String(modal.slotIdx))
    fd.append('subject_name', subjectInput)
    fd.append('teacher_id', teacherInput)
    fd.append('room', roomInput)
    startTransition(async () => {
      await addSlot(fd)
      closeModal()
    })
  }

  async function handleDelete(slot: TimetableSlot) {
    if (!deleteSlot || !classId) return
    startTransition(async () => {
      await deleteSlot(slot.id, classId)
    })
  }

  return (
    <div className="relative">
      {/* Grid */}
      <div id="timetable-grid" className="bg-white rounded-xl shadow-sm overflow-auto">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Horaire
              </th>
              {DAYS_OF_WEEK.map((d) => (
                <th
                  key={d.index}
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                >
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot, slotRowIdx) => (
              <tr
                key={slot.index}
                className={`border-b border-gray-100 ${slotRowIdx === 3 ? 'border-b-4 border-b-gray-200' : ''}`}
              >
                <td className="px-3 py-2 border-r border-gray-200 bg-gray-50">
                  <span className="text-xs font-mono text-gray-600 whitespace-nowrap">{slot.label}</span>
                </td>
                {DAYS_OF_WEEK.map((day) => {
                  const cell = slotMap.get(`${day.index}-${slot.index}`)
                  return (
                    <td
                      key={day.index}
                      className="px-2 py-1.5 border-r border-gray-100 last:border-r-0 align-top"
                      style={{ minHeight: 56 }}
                    >
                      {cell ? (
                        <div
                          className={`rounded-lg border px-2.5 py-1.5 ${subjectColor(cell.subject_name)} relative group`}
                        >
                          <p className="font-semibold text-xs leading-tight">{cell.subject_name}</p>
                          {mode === 'teacher' && cell.class && (
                            <p className="text-xs opacity-70 mt-0.5">{(cell.class as any).name}</p>
                          )}
                          {mode === 'class' && cell.teacher && (
                            <p className="text-xs opacity-70 mt-0.5 truncate">
                              {(cell.teacher as any).full_name}
                            </p>
                          )}
                          {cell.room && (
                            <p className="text-xs opacity-60 mt-0.5">Salle {cell.room}</p>
                          )}
                          {mode === 'class' && deleteSlot && (
                            <button
                              onClick={() => handleDelete(cell)}
                              disabled={isPending}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              title="Supprimer"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : mode === 'class' && addSlot ? (
                        <button
                          onClick={() => openModal(day.index, slot.index)}
                          className="w-full h-12 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-indigo-50/50 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      ) : (
                        <div className="h-12" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend for teacher view */}
      {mode === 'teacher' && slots.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          Vue en lecture seule. Pour modifier, éditez l&apos;emploi du temps de la classe concernée.
        </p>
      )}

      {/* Add Slot Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Ajouter un créneau
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {DAYS_OF_WEEK.find((d) => d.index === modal.day)?.label} —{' '}
              {TIME_SLOTS.find((s) => s.index === modal.slotIdx)?.label}
            </p>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Matière <span className="text-red-500">*</span>
                </label>
                <input
                  list="subjects-list"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  required
                  placeholder="Ex. Mathématiques"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {subjects.length > 0 && (
                  <datalist id="subjects-list">
                    {subjects.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Enseignant
                </label>
                <select
                  value={teacherInput}
                  onChange={(e) => setTeacherInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Sélectionner…</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Salle (optionnel)
                </label>
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Ex. A12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending || !subjectInput.trim()}
                  className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? 'Enregistrement…' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
