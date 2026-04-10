import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Child = {
  id: string
  full_name: string
  student_number?: string | null
  class?: { name: string; grade_level?: string | null } | { name: string; grade_level?: string | null }[] | null
  attendanceRate?: number | null
  avgGrade?: number | null
}

export default function ChildrenScreen() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return

    const { data } = await supabase
      .from('students')
      .select('id, full_name, student_number, class:classes(name, grade_level)')
      .eq('parent_id', user.id)
      .order('full_name')

    const kids = (data as Child[]) ?? []

    if (kids.length > 0) {
      const ids = kids.map((k) => k.id)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [{ data: att }, { data: grades }] = await Promise.all([
        supabase
          .from('attendance')
          .select('student_id, status')
          .in('student_id', ids)
          .gte('date', thirtyDaysAgo),
        supabase
          .from('grades')
          .select('student_id, grade_value, max_grade')
          .in('student_id', ids),
      ])

      const enriched = kids.map((k) => {
        const attRows = (att ?? []).filter((a: any) => a.student_id === k.id)
        const present = attRows.filter((a: any) => a.status === 'present').length
        const attRate = attRows.length > 0 ? Math.round((present / attRows.length) * 100) : null

        const validGrades = (grades ?? []).filter(
          (g: any) => g.student_id === k.id && g.grade_value !== null && g.max_grade > 0
        )
        const avg =
          validGrades.length > 0
            ? Math.round(
                validGrades.reduce((s: number, g: any) => s + (g.grade_value / g.max_grade) * 100, 0) /
                  validGrades.length
              )
            : null

        return { ...k, attendanceRate: attRate, avgGrade: avg }
      })

      setRows(enriched)
    } else {
      setRows([])
    }
  }, [user?.id])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  function cls(r: Child) {
    const c = r.class
    if (!c) return null
    if (Array.isArray(c)) return c[0]
    return c
  }

  function attColor(rate: number | null | undefined) {
    if (rate === null || rate === undefined) return '#64748b'
    if (rate >= 90) return '#10b981'
    if (rate >= 75) return '#f59e0b'
    return '#ef4444'
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
    >
      {rows.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>👨‍👩‍👧</Text>
          <Text style={s.emptyText}>Aucun enfant lié à votre compte.</Text>
        </View>
      ) : (
        rows.map((r) => {
          const c = cls(r)
          return (
            <TouchableOpacity
              key={r.id}
              style={s.card}
              onPress={() => router.push(`/children/${r.id}` as any)}
              activeOpacity={0.75}
            >
              <View style={s.cardHeader}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{r.full_name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{r.full_name}</Text>
                  {r.student_number ? (
                    <Text style={s.meta}>N° {r.student_number}</Text>
                  ) : null}
                  {c ? (
                    <Text style={s.meta}>
                      {c.name}
                      {c.grade_level ? ` · ${c.grade_level}` : ''}
                    </Text>
                  ) : null}
                </View>
                <Text style={s.chevron}>›</Text>
              </View>

              <View style={s.statsRow}>
                <View style={s.badge}>
                  <Text style={s.badgeLabel}>Présence</Text>
                  <Text style={[s.badgeValue, { color: attColor(r.attendanceRate) }]}>
                    {r.attendanceRate !== null && r.attendanceRate !== undefined
                      ? `${r.attendanceRate}%`
                      : '—'}
                  </Text>
                </View>
                <View style={[s.badge, { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' }]}>
                  <Text style={s.badgeLabel}>Moy. notes</Text>
                  <Text style={[s.badgeValue, { color: '#4f46e5' }]}>
                    {r.avgGrade !== null && r.avgGrade !== undefined ? `${r.avgGrade}%` : '—'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        })
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#64748b' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#4f46e5' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 2 },
  chevron: { fontSize: 24, color: '#94a3b8' },

  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  badge: { flex: 1, padding: 12, alignItems: 'center' },
  badgeLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
})
