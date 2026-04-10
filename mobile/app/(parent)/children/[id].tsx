import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type AttRow = { date: string; status: string; notes?: string | null }
type GradeRow = {
  id: string
  grade_value: number
  max_grade: number
  date: string
  notes?: string | null
  subject?: { name: string } | null
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  present:  { bg: '#d1fae5', text: '#065f46', label: 'Présent' },
  absent:   { bg: '#fee2e2', text: '#991b1b', label: 'Absent' },
  late:     { bg: '#fef3c7', text: '#92400e', label: 'Retard' },
  excused:  { bg: '#dbeafe', text: '#1e40af', label: 'Excusé' },
}

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const [child, setChild] = useState<any>(null)
  const [attendance, setAttendance] = useState<AttRow[]>([])
  const [grades, setGrades] = useState<GradeRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user?.id || !id) return

    const [{ data: childData }, { data: att }, { data: gr }] = await Promise.all([
      supabase
        .from('students')
        .select('id, full_name, student_number, class:classes(name, grade_level, academic_year)')
        .eq('id', id)
        .eq('parent_id', user.id)
        .maybeSingle(),
      supabase
        .from('attendance')
        .select('date, status, notes')
        .eq('student_id', id)
        .order('date', { ascending: false })
        .limit(30),
      supabase
        .from('grades')
        .select('id, grade_value, max_grade, date, notes, subject:subjects(name)')
        .eq('student_id', id)
        .order('date', { ascending: false })
        .limit(20),
    ])

    setChild(childData)
    setAttendance((att as AttRow[]) ?? [])
    setGrades((gr as GradeRow[]) ?? [])
  }, [user?.id, id])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  if (!child) {
    return (
      <View style={s.center}>
        <Text style={{ color: '#64748b' }}>Enfant introuvable.</Text>
      </View>
    )
  }

  const cls = Array.isArray(child.class) ? child.class[0] : child.class

  const present = attendance.filter((a) => a.status === 'present').length
  const absent = attendance.filter((a) => a.status === 'absent').length
  const late = attendance.filter((a) => a.status === 'late').length
  const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null

  const validGrades = grades.filter((g) => g.grade_value !== null && g.max_grade > 0)
  const avgGrade =
    validGrades.length > 0
      ? Math.round(
          validGrades.reduce((s, g) => s + (g.grade_value / g.max_grade) * 100, 0) / validGrades.length
        )
      : null

  // Group grades by subject
  const bySubject: Record<string, GradeRow[]> = {}
  for (const g of grades) {
    const sub = (g.subject as any)?.name ?? 'Autre'
    if (!bySubject[sub]) bySubject[sub] = []
    bySubject[sub].push(g)
  }

  return (
    <>
      <Stack.Screen options={{ title: child.full_name }} />
      <ScrollView style={s.container} contentContainerStyle={s.content}>

        {/* Header card */}
        <View style={s.headerCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{child.full_name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.childName}>{child.full_name}</Text>
            {child.student_number ? (
              <Text style={s.childMeta}>N° {child.student_number}</Text>
            ) : null}
            {cls ? (
              <Text style={s.childMeta}>
                {cls.name}
                {cls.grade_level ? ` · ${cls.grade_level}` : ''}
                {cls.academic_year ? ` · ${cls.academic_year}` : ''}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { borderTopColor: '#10b981' }]}>
            <Text style={[s.statNum, { color: '#10b981' }]}>
              {attRate !== null ? `${attRate}%` : '—'}
            </Text>
            <Text style={s.statLabel}>Présence</Text>
          </View>
          <View style={[s.statCard, { borderTopColor: '#4f46e5' }]}>
            <Text style={[s.statNum, { color: '#4f46e5' }]}>
              {avgGrade !== null ? `${avgGrade}%` : '—'}
            </Text>
            <Text style={s.statLabel}>Moy. notes</Text>
          </View>
          <View style={[s.statCard, { borderTopColor: '#ef4444' }]}>
            <Text style={[s.statNum, { color: '#ef4444' }]}>{absent}</Text>
            <Text style={s.statLabel}>Absences</Text>
          </View>
          <View style={[s.statCard, { borderTopColor: '#f59e0b' }]}>
            <Text style={[s.statNum, { color: '#f59e0b' }]}>{late}</Text>
            <Text style={s.statLabel}>Retards</Text>
          </View>
        </View>

        {/* Grades by subject */}
        {Object.keys(bySubject).length > 0 && (
          <>
            <Text style={s.sectionTitle}>Notes par matière</Text>
            {Object.entries(bySubject).map(([subject, gradeList]) => {
              const vg = gradeList.filter((g) => g.grade_value !== null && g.max_grade > 0)
              const subAvg =
                vg.length > 0
                  ? Math.round(
                      vg.reduce((sum, g) => sum + (g.grade_value / g.max_grade) * 20, 0) / vg.length * 10
                    ) / 10
                  : null
              return (
                <View key={subject} style={s.subjectCard}>
                  <View style={s.subjectHeader}>
                    <Text style={s.subjectName}>{subject}</Text>
                    {subAvg !== null && (
                      <Text style={s.subjectAvg}>{subAvg}/20</Text>
                    )}
                  </View>
                  {gradeList.slice(0, 3).map((g) => (
                    <View key={g.id} style={s.gradeRow}>
                      <Text style={s.gradeDate}>
                        {new Date(g.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </Text>
                      <Text style={s.gradeValue}>
                        {g.grade_value !== null ? `${g.grade_value}/${g.max_grade}` : '—'}
                      </Text>
                      <Text style={s.gradePct}>
                        {g.grade_value !== null && g.max_grade > 0
                          ? `${Math.round((g.grade_value / g.max_grade) * 100)}%`
                          : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </>
        )}

        {/* Attendance history */}
        {attendance.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Présences récentes (30 derniers jours)</Text>
            <View style={s.attCard}>
              {attendance.slice(0, 15).map((a, i) => {
                const meta = STATUS_COLORS[a.status] ?? { bg: '#f1f5f9', text: '#334155', label: a.status }
                return (
                  <View
                    key={`${a.date}-${i}`}
                    style={[s.attRow, i > 0 && { borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}
                  >
                    <Text style={s.attDate}>
                      {new Date(a.date).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <View style={[s.attBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[s.attBadgeText, { color: meta.text }]}>{meta.label}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {grades.length === 0 && attendance.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Aucune donnée disponible pour cet élève.</Text>
          </View>
        )}
      </ScrollView>
    </>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#4f46e5' },
  childName: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  childMeta: { fontSize: 13, color: '#64748b', marginTop: 3 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },

  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  subjectAvg: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  gradeDate: { fontSize: 12, color: '#94a3b8', width: 70 },
  gradeValue: { fontSize: 14, fontWeight: '600', color: '#334155', flex: 1 },
  gradePct: { fontSize: 12, color: '#64748b' },

  attCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  attRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  attDate: { fontSize: 13, color: '#334155' },
  attBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  attBadgeText: { fontSize: 12, fontWeight: '600' },

  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
})
