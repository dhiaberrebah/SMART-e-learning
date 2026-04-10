'use client'

import { useState } from 'react'
import Link from 'next/link'
import { handleAddClass } from './actions'

type Teacher = { id: string; full_name: string | null }
type Assignment = { teacher_id: string; subject_name: string }

export function AddClassForm({
  teachers,
  gradeOptions,
  error,
}: {
  teachers: Teacher[]
  gradeOptions: readonly string[]
  error?: string
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([
    { teacher_id: '', subject_name: '' },
  ])

  function addRow() {
    setAssignments((prev) => [...prev, { teacher_id: '', subject_name: '' }])
  }

  function removeRow(i: number) {
    setAssignments((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: keyof Assignment, value: string) {
    setAssignments((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

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
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
            <p className="font-medium">Nom attribué automatiquement</p>
            <p className="mt-1 text-indigo-800/90">
              Format : <strong>niveau</strong> + lettre de section{' '}
              <strong>a</strong>, <strong>b</strong>, <strong>c</strong>… (ex.{' '}
              <span className="font-mono text-xs bg-white/80 px-1.5 py-0.5 rounded">
                1re année a
              </span>
              , puis{' '}
              <span className="font-mono text-xs bg-white/80 px-1.5 py-0.5 rounded">
                1re année b
              </span>
              ).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
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
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Année scolaire
              </label>
              <input
                type="text"
                name="academic_year"
                placeholder="Ex : 2024-2025"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Teacher + Subject Assignments */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                Enseignants &amp; matières
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Chaque enseignant est assigné à une matière dans cette classe.
              </p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>

          {teachers.length === 0 && (
            <p className="text-xs text-amber-600">
              Aucun enseignant disponible.{' '}
              <Link href="/admin/users/add" className="underline">
                Ajouter un enseignant
              </Link>
            </p>
          )}

          <div className="space-y-3">
            {assignments.map((row, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Enseignant
                  </label>
                  <select
                    value={row.teacher_id}
                    onChange={(e) => updateRow(i, 'teacher_id', e.target.value)}
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
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Matière
                  </label>
                  <input
                    type="text"
                    placeholder="Ex. Mathématiques"
                    value={row.subject_name}
                    onChange={(e) => updateRow(i, 'subject_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={assignments.length === 1}
                    className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            Les lignes incomplètes (sans enseignant ou sans matière) seront ignorées.
          </p>
        </div>

        {/* hidden field carrying the assignments JSON */}
        <input
          type="hidden"
          name="assignments"
          value={JSON.stringify(assignments)}
        />

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
