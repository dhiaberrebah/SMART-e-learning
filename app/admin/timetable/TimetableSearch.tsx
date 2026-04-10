'use client'

import { useState } from 'react'
import Link from 'next/link'

type ClassItem = { id: string; name: string; grade_level: string | null }
type TeacherItem = { id: string; full_name: string | null }

interface Props {
  classes: ClassItem[]
  teachers: TeacherItem[]
}

export function TimetableSearch({ classes, teachers }: Props) {
  const [classQ, setClassQ] = useState('')
  const [teacherQ, setTeacherQ] = useState('')

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(classQ.toLowerCase()) ||
      (c.grade_level ?? '').toLowerCase().includes(classQ.toLowerCase())
  )

  const filteredTeachers = teachers.filter((t) =>
    (t.full_name ?? '').toLowerCase().includes(teacherQ.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Par classe */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Card header */}
        <div className="px-5 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Par classe</h2>
              <p className="text-xs text-gray-500">
                {filteredClasses.length}/{classes.length} classe(s)
              </p>
            </div>
          </div>
          {/* Search input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={classQ}
              onChange={(e) => setClassQ(e.target.value)}
              placeholder="Rechercher une classe…"
              className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {classQ && (
              <button
                onClick={() => setClassQ('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-50 overflow-y-auto no-scrollbar max-h-80">
          {filteredClasses.map((c) => (
            <Link
              key={c.id}
              href={`/admin/timetable/class/${c.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-indigo-50/60 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">
                  {highlight(c.name, classQ)}
                </p>
                {c.grade_level && (
                  <p className="text-xs text-gray-400">{c.grade_level}</p>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
          {filteredClasses.length === 0 && classes.length > 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Aucune classe ne correspond à &ldquo;{classQ}&rdquo;.
            </div>
          )}
          {classes.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">Aucune classe disponible.</p>
              <Link href="/admin/classes/add" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
                Créer une classe →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Par enseignant */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Card header */}
        <div className="px-5 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Par enseignant</h2>
              <p className="text-xs text-gray-500">
                {filteredTeachers.length}/{teachers.length} enseignant(s)
              </p>
            </div>
          </div>
          {/* Search input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={teacherQ}
              onChange={(e) => setTeacherQ(e.target.value)}
              placeholder="Rechercher un enseignant…"
              className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {teacherQ && (
              <button
                onClick={() => setTeacherQ('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-50 overflow-y-auto no-scrollbar max-h-80">
          {filteredTeachers.map((t) => (
            <Link
              key={t.id}
              href={`/admin/timetable/teacher/${t.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-emerald-50/60 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 text-xs font-bold">
                    {t.full_name?.charAt(0)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-700">
                  {highlight(t.full_name ?? '', teacherQ)}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
          {filteredTeachers.length === 0 && teachers.length > 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Aucun enseignant ne correspond à &ldquo;{teacherQ}&rdquo;.
            </div>
          )}
          {teachers.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">Aucun enseignant disponible.</p>
              <Link href="/admin/users/add" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
                Ajouter un enseignant →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Wrap matched substring in a bold span */
function highlight(text: string, query: string) {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded px-0.5 font-semibold not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
