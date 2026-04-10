import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Child = { id: string; full_name: string }
type Grade = {
  id: string
  grade_value: number | null
  max_grade: number
  date: string
  notes?: string | null
  subject?: { name: string } | null
}

export default function GradesScreen() {
  const { user } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [gradesLoading, setGradesLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadChildren = useCallback(async () => {
    if (!user?.id) return []
    const { data } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('parent_id', user.id)
      .order('full_name')
    return (data as Child[]) ?? []
  }, [user?.id])

  const loadGrades = useCallback(async (childId: string) => {
    if (!childId) return
    setGradesLoading(true)
    const { data } = await supabase
      .from('grades')
      .select('id, grade_value, max_grade, date, notes, subject:subjects(name)')
      .eq('student_id', childId)
      .order('date', { ascending: false })
    setGrades((data as Grade[]) ?? [])
    setGradesLoading(false)
  }, [])

  const load = useCallback(async () => {
    const kids = await loadChildren()
    setChildren(kids)
    const first = kids[0]?.id ?? ''
    setSelectedId(first)
    if (first) await loadGrades(first)
  }, [loadChildren, loadGrades])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadGrades(selectedId)
    setRefreshing(false)
  }

  const selectChild = async (id: string) => {
    setSelectedId(id)
    await loadGrades(id)
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  // Stats
  const valid = grades.filter((g) => g.grade_value !== null && g.max_grade > 0)
  const avg =
    valid.length > 0
      ? Math.round(
          valid.reduce((sum, g) => sum + (g.grade_value! / g.max_grade) * 100, 0) / valid.length
        )
      : null
  const best =
    valid.length > 0
      ? valid.reduce((b, g) => (g.grade_value! / g.max_grade > b.grade_value! / b.max_grade ? g : b))
      : null
  const worst =
    valid.length > 0
      ? valid.reduce((w, g) => (g.grade_value! / g.max_grade < w.grade_value! / w.max_grade ? g : w))
      : null

  // Group by subject
  const bySubject: Record<string, Grade[]> = {}
  for (const g of grades) {
    const sub = (g.subject as any)?.name ?? 'Autre'
    if (!bySubject[sub]) bySubject[sub] = []
    bySubject[sub].push(g)
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
    >
      {/* Child selector */}
      {children.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs} contentContainerStyle={s.tabsContent}>
          {children.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.tab, selectedId === c.id && s.tabActive]}
              onPress={() => selectChild(c.id)}
            >
              <Text style={[s.tabText, selectedId === c.id && s.tabTextActive]}>{c.full_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {gradesLoading ? (
        <ActivityIndicator color="#4f46e5" style={{ marginTop: 32 }} />
      ) : grades.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>📝</Text>
          <Text style={s.emptyText}>Aucune note enregistrée.</Text>
        </View>
      ) : (
        <>
          {/* Stats */}
          <View style={s.statsRow}>
            <View style={[s.statCard, { borderTopColor: '#4f46e5' }]}>
              <Text style={[s.statNum, { color: '#4f46e5' }]}>{avg !== null ? `${avg}%` : '—'}</Text>
              <Text style={s.statLabel}>Moyenne</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: '#10b981' }]}>
              <Text style={[s.statNum, { color: '#10b981' }]}>
                {best ? `${best.grade_value}/${best.max_grade}` : '—'}
              </Text>
              <Text style={s.statLabel}>Meilleure</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: '#ef4444' }]}>
              <Text style={[s.statNum, { color: '#ef4444' }]}>
                {worst ? `${worst.grade_value}/${worst.max_grade}` : '—'}
              </Text>
              <Text style={s.statLabel}>Plus basse</Text>
            </View>
          </View>

          {/* By subject */}
          {Object.entries(bySubject).map(([subject, gradeList]) => {
            const vg = gradeList.filter((g) => g.grade_value !== null && g.max_grade > 0)
            const subAvg =
              vg.length > 0
                ? Math.round(
                    (vg.reduce((s, g) => s + (g.grade_value! / g.max_grade) * 20, 0) / vg.length) * 10
                  ) / 10
                : null

            return (
              <View key={subject} style={s.subjectCard}>
                <View style={s.subjectHeader}>
                  <Text style={s.subjectName}>{subject}</Text>
                  <View style={s.subjectBadge}>
                    <Text style={s.subjectBadgeText}>
                      {subAvg !== null ? `Moy: ${subAvg}/20` : `${gradeList.length} note${gradeList.length > 1 ? 's' : ''}`}
                    </Text>
                  </View>
                </View>

                {gradeList.map((g) => {
                  const pct = g.grade_value !== null && g.max_grade > 0
                    ? Math.round((g.grade_value / g.max_grade) * 100)
                    : null
                  const color = pct === null ? '#94a3b8' : pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
                  return (
                    <View key={g.id} style={s.gradeRow}>
                      <Text style={s.gradeDate}>
                        {new Date(g.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </Text>
                      <View style={{ flex: 1 }}>
                        {g.notes ? <Text style={s.gradeNotes} numberOfLines={1}>{g.notes}</Text> : null}
                      </View>
                      <Text style={[s.gradeValue, { color }]}>
                        {g.grade_value !== null ? `${g.grade_value}/${g.max_grade}` : '—'}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )
          })}
        </>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  tabs: { marginBottom: 14, marginHorizontal: -16 },
  tabsContent: { paddingHorizontal: 16, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  tabActive: { backgroundColor: '#4f46e5' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#64748b' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center' },

  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  subjectName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  subjectBadge: { backgroundColor: '#ede9fe', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  subjectBadgeText: { fontSize: 12, fontWeight: '600', color: '#4f46e5' },

  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    gap: 8,
  },
  gradeDate: { fontSize: 12, color: '#94a3b8', width: 80 },
  gradeNotes: { fontSize: 12, color: '#64748b' },
  gradeValue: { fontSize: 15, fontWeight: '700', minWidth: 60, textAlign: 'right' },
})
