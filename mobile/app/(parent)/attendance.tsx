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
type AttRow = { date: string; status: string; notes?: string | null }

const STATUS_META: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  present: { bg: '#d1fae5', text: '#065f46', label: 'Présent',  dot: '#10b981' },
  absent:  { bg: '#fee2e2', text: '#991b1b', label: 'Absent',   dot: '#ef4444' },
  late:    { bg: '#fef3c7', text: '#92400e', label: 'Retard',   dot: '#f59e0b' },
  excused: { bg: '#dbeafe', text: '#1e40af', label: 'Excusé',   dot: '#3b82f6' },
}

export default function AttendanceScreen() {
  const { user } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [records, setRecords] = useState<AttRow[]>([])
  const [loading, setLoading] = useState(true)
  const [attLoading, setAttLoading] = useState(false)
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

  const loadAttendance = useCallback(async (childId: string) => {
    if (!childId) return
    setAttLoading(true)
    const { data } = await supabase
      .from('attendance')
      .select('date, status, notes')
      .eq('student_id', childId)
      .order('date', { ascending: false })
      .limit(60)
    setRecords((data as AttRow[]) ?? [])
    setAttLoading(false)
  }, [])

  const load = useCallback(async () => {
    const kids = await loadChildren()
    setChildren(kids)
    const first = kids[0]?.id ?? ''
    setSelectedId(first)
    if (first) await loadAttendance(first)
  }, [loadChildren, loadAttendance])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAttendance(selectedId)
    setRefreshing(false)
  }

  const selectChild = async (id: string) => {
    setSelectedId(id)
    await loadAttendance(id)
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  const present = records.filter((r) => r.status === 'present').length
  const absent  = records.filter((r) => r.status === 'absent').length
  const late    = records.filter((r) => r.status === 'late').length
  const excused = records.filter((r) => r.status === 'excused').length
  const total   = records.length
  const rate    = total > 0 ? Math.round((present / total) * 100) : null

  // Group by month
  const byMonth: Record<string, AttRow[]> = {}
  for (const r of records) {
    const key = r.date.slice(0, 7) // "2026-04"
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(r)
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

      {attLoading ? (
        <ActivityIndicator color="#4f46e5" style={{ marginTop: 32 }} />
      ) : records.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyText}>Aucun enregistrement de présence.</Text>
        </View>
      ) : (
        <>
          {/* Stats */}
          <View style={s.statsGrid}>
            <View style={[s.statCard, { borderTopColor: '#10b981' }]}>
              <Text style={[s.statNum, { color: '#10b981' }]}>
                {rate !== null ? `${rate}%` : '—'}
              </Text>
              <Text style={s.statLabel}>Taux</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: '#10b981' }]}>
              <Text style={[s.statNum, { color: '#10b981' }]}>{present}</Text>
              <Text style={s.statLabel}>Présent</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: '#ef4444' }]}>
              <Text style={[s.statNum, { color: '#ef4444' }]}>{absent}</Text>
              <Text style={s.statLabel}>Absent</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: '#f59e0b' }]}>
              <Text style={[s.statNum, { color: '#f59e0b' }]}>{late}</Text>
              <Text style={s.statLabel}>Retard</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={s.legendRow}>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <View key={key} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: meta.dot }]} />
                <Text style={s.legendText}>{meta.label}</Text>
              </View>
            ))}
          </View>

          {/* Records grouped by month */}
          {Object.entries(byMonth).map(([monthKey, rows]) => {
            const [yr, mo] = monthKey.split('-')
            const monthLabel = new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })
            return (
              <View key={monthKey} style={{ marginBottom: 16 }}>
                <Text style={s.monthLabel}>{monthLabel}</Text>
                <View style={s.attCard}>
                  {rows.map((r, i) => {
                    const meta = STATUS_META[r.status] ?? { bg: '#f1f5f9', text: '#334155', label: r.status, dot: '#94a3b8' }
                    const dayLabel = new Date(r.date).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                    })
                    return (
                      <View
                        key={`${r.date}-${i}`}
                        style={[s.attRow, i > 0 && { borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}
                      >
                        <View style={[s.dot, { backgroundColor: meta.dot }]} />
                        <Text style={s.attDate}>{dayLabel}</Text>
                        <View style={{ flex: 1 }}>
                          {r.notes ? (
                            <Text style={s.attNotes} numberOfLines={1}>{r.notes}</Text>
                          ) : null}
                        </View>
                        <View style={[s.badge, { backgroundColor: meta.bg }]}>
                          <Text style={[s.badgeText, { color: meta.text }]}>{meta.label}</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
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
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#4f46e5' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#64748b' },

  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
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
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center' },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#64748b' },

  monthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  attCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  attRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  attDate: { fontSize: 13, color: '#334155', width: 60 },
  attNotes: { fontSize: 12, color: '#94a3b8' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
})
