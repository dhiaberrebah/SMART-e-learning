'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DAYS_OF_WEEK, TIME_SLOTS, TimetableSlot } from '@/lib/timetable'

interface Props {
  slots: TimetableSlot[]
  title: string
  filename?: string
  label?: string
}

const SUBJECT_COLORS: [number, number, number][] = [
  [199, 210, 254], // indigo-200
  [167, 243, 208], // emerald-200
  [253, 230, 138], // amber-200
  [254, 202, 202], // rose-200
  [186, 230, 253], // sky-200
  [221, 214, 254], // violet-200
  [254, 215, 170], // orange-200
  [153, 246, 228], // teal-200
]

function subjectColorRgb(name: string): [number, number, number] {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length]
}

export function TimetablePDFButton({
  slots,
  title,
  filename = 'emploi-du-temps.pdf',
  label = 'Télécharger PDF',
}: Props) {
  const [loading, setLoading] = useState(false)

  function handleDownload() {
    setLoading(true)
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      // Header
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(title, 14, 14)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 20)
      doc.setTextColor(0)

      // Build slot map
      const slotMap = new Map<string, TimetableSlot>()
      slots.forEach((s) => slotMap.set(`${s.day_of_week}-${s.slot_index}`, s))

      // Table head
      const head = [['Horaire', ...DAYS_OF_WEEK.map((d) => d.label)]]

      // Table body
      const body = TIME_SLOTS.map((ts) => {
        const row: any[] = [ts.label]
        DAYS_OF_WEEK.forEach((day) => {
          const cell = slotMap.get(`${day.index}-${ts.index}`)
          if (cell) {
            const lines: string[] = [cell.subject_name]
            const teacherName = (cell.teacher as any)?.full_name
            const className = (cell.class as any)?.name
            if (teacherName) lines.push(teacherName)
            if (className) lines.push(className)
            if (cell.room) lines.push(`Salle ${cell.room}`)
            row.push(lines.join('\n'))
          } else {
            row.push('')
          }
        })
        return row
      })

      autoTable(doc, {
        startY: 25,
        head,
        body,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 26, halign: 'center', fontStyle: 'bold', fontSize: 7 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 'auto' },
          6: { cellWidth: 'auto' },
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          minCellHeight: 14,
        },
        didParseCell(data) {
          if (data.section === 'body' && data.column.index > 0) {
            const cell = slotMap.get(
              `${DAYS_OF_WEEK[data.column.index - 1].index}-${TIME_SLOTS[data.row.index].index}`
            )
            if (cell) {
              const rgb = subjectColorRgb(cell.subject_name)
              data.cell.styles.fillColor = rgb
              data.cell.styles.textColor = [30, 30, 30]
              data.cell.styles.fontStyle = 'bold'
            }
          }
          // Lunch break separator
          if (data.section === 'body' && data.row.index === 3) {
            data.cell.styles.lineWidth = { bottom: 0.8 }
          }
        },
      })

      doc.save(filename)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
      {loading ? 'Génération…' : label}
    </button>
  )
}
