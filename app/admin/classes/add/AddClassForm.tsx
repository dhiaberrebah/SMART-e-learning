'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { handleAddClass } from './actions'

type Teacher = {
  id: string
  full_name: string | null
  specialties: string[]
}

type Assignment = { teacher_id: string; subject_name: string }

const SUBJECT_POOL = [
  'Mathématiques', 'Français', 'Arabe', 'Sciences', 'Anglais',
  'Histoire-Géographie', 'Éducation Islamique', 'Éducation Physique',
  'Informatique', 'Arts Plastiques', 'Musique',
]

function pickOne(specialties: string[]): string {
  const pool = specialties.length > 0 ? specialties : SUBJECT_POOL
  return pool[Math.floor(Math.random() * pool.length)]
}

export function AddClassForm({
  teachers,
  gradeOptions,
  error,
}: {
  teachers: Teacher[]
  gradeOptions: readonly string[]
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Each teacher gets one fixed random subject for the entire session
  const subjectMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const t of teachers) {
      map[t.id] = pickOne(t.specialties)
    }
    return map
  }, [teachers])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const assignments: Assignment[] = [...checked].map((id) => ({
    teacher_id: id,
    subject_name: subjectMap[id] ?? '',
  }))

  const selectedCount = checked.size

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/classes" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer une classe</h1>
          <p className="text-gray-500 text-sm mt-0.5">Nouvelle classe scolaire</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={handleAddClass} className="space-y-5">
        {/* Basic info */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
            <p className="font-medium">Nom attribué automatiquement</p>
            <p className="mt-1 text-indigo-800/90">
              Pour un même niveau, la lettre est la suivante disponible dans l&apos;ordre{' '}
              <strong>a</strong>, <strong>b</strong>, <strong>c</strong>… (toutes les classes de ce niveau sont comptées, ex.{' '}
              <span className="font-mono text-xs bg-white/80 px-1.5 py-0.5 rounded">1re année a</span> puis{' '}
              <span className="font-mono text-xs bg-white/80 px-1.5 py-0.5 rounded">1re année b</span>).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Brève description de la classe"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Niveau scolaire <span className="text-red-500">*</span>
              </label>
              <select
                name="grade_level"
                required
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Choisir un niveau</option>
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Année scolaire</label>
              <input
                type="text"
                name="academic_year"
                placeholder="Ex : 2024-2025"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Teacher dropdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Enseignants &amp; matières</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Chaque enseignant a une matière assignée automatiquement.
            </p>
          </div>

          {teachers.length === 0 ? (
            <p className="text-xs text-amber-600">
              Aucun enseignant disponible.{' '}
              <Link href="/admin/users/add" className="underline">Ajouter un enseignant</Link>
            </p>
          ) : (
            <div ref={dropdownRef} className="relative">
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <span className={selectedCount === 0 ? 'text-gray-400' : 'text-gray-800'}>
                  {selectedCount === 0
                    ? 'Sélectionner des enseignants…'
                    : `${selectedCount} enseignant${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''}`}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown panel */}
              {open && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {teachers.map((t) => {
                    const isChecked = checked.has(t.id)
                    const subject = subjectMap[t.id]
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(t.id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800 block truncate">
                            {t.full_name ?? '—'}
                          </span>
                          <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {subject}
                          </span>
                        </div>
                        {isChecked && (
                          <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Selected summary chips */}
          {selectedCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[...checked].map((id) => {
                const t = teachers.find((x) => x.id === id)
                if (!t) return null
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-xs"
                  >
                    <span className="font-medium text-gray-800">{t.full_name}</span>
                    <span className="text-indigo-600">·</span>
                    <span className="text-indigo-700 font-medium">{subjectMap[id]}</span>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <input type="hidden" name="assignments" value={JSON.stringify(assignments)} />

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
          >
            Créer la classe
          </button>
          <Link
            href="/admin/classes"
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
