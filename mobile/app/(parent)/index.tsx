import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Child = { id: string; full_name: string; class?: { name: string } | { name: string }[] | null }
type Message = { id: string; title: string; body: string; created_at: string }
type Event = { id: string; title: string; start_at: string; location?: string | null }

export default function ParentHomeScreen() {
  const { user, profile } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null)
  const [avgGrade, setAvgGrade] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [{ data: kids }, { data: msgs }, { data: evts }] = await Promise.all([
      supabase
        .from('students')
        .select('id, full_name, class:classes(name)')
        .eq('parent_id', user.id)
        .order('full_name'),
      supabase
        .from('admin_broadcast_messages')
        .select('id, title, body, created_at')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('events')
        .select('id, title, start_at, location')
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(3),
    ])

    const kidRows = (kids as Child[]) ?? []
    setChildren(kidRows)
    setMessages((msgs as Message[]) ?? [])
    setEvents((evts as Event[]) ?? [])

    if (kidRows.length > 0) {
      const ids = kidRows.map((k) => k.id)

      const [{ data: att }, { data: grades }] = await Promise.all([
        supabase
          .from('attendance')
          .select('status')
          .in('student_id', ids)
          .gte('date', thirtyDaysAgo),
        supabase
          .from('grades')
          .select('grade_value, max_grade')
          .in('student_id', ids),
      ])

      const attRows = att ?? []
      const present = attRows.filter((a: any) => a.status === 'present').length
      setAttendanceRate(attRows.length > 0 ? Math.round((present / attRows.length) * 100) : null)

      const validGrades = (grades ?? []).filter((g: any) => g.grade_value !== null && g.max_grade > 0)
      if (validGrades.length > 0) {
        const avg =
          validGrades.reduce((s: number, g: any) => s + (g.grade_value / g.max_grade) * 100, 0) /
          validGrades.length
        setAvgGrade(Math.round(avg))
      }
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

  function className(c: Child) {
    const cl = c.class
    if (!cl) return '—'
    if (Array.isArray(cl)) return cl[0]?.name ?? '—'
    return cl.name ?? '—'
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenue'

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
    >
      {/* Greeting */}
      <Text style={s.greeting}>Bonjour, {firstName} 👋</Text>
      <Text style={s.sub}>Voici le résumé de votre famille</Text>

      {/* Stat cards */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { borderTopColor: '#4f46e5' }]}>
          <Text style={[s.statNum, { color: '#4f46e5' }]}>{children.length}</Text>
          <Text style={s.statLabel}>Enfant{children.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={[s.statCard, { borderTopColor: '#10b981' }]}>
          <Text style={[s.statNum, { color: '#10b981' }]}>
            {attendanceRate !== null ? `${attendanceRate}%` : '—'}
          </Text>
          <Text style={s.statLabel}>Présence</Text>
        </View>
        <View style={[s.statCard, { borderTopColor: '#f59e0b' }]}>
          <Text style={[s.statNum, { color: '#f59e0b' }]}>
            {avgGrade !== null ? `${avgGrade}%` : '—'}
          </Text>
          <Text style={s.statLabel}>Moy. notes</Text>
        </View>
      </View>

      {/* Children quick list */}
      {children.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Mes enfants</Text>
          {children.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={s.childRow}
              onPress={() => router.push(`/children/${c.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={s.avatar}>
                <Text style={s.avatarText}>{c.full_name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.childName}>{c.full_name}</Text>
                <Text style={s.childClass}>{className(c)}</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Upcoming events */}
      {events.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Événements à venir</Text>
          {events.map((e) => (
            <View key={e.id} style={s.eventCard}>
              <View style={s.eventDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.eventTitle}>{e.title}</Text>
                <Text style={s.eventMeta}>
                  {new Date(e.start_at).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  {e.location ? ` · ${e.location}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Admin messages */}
      {messages.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Messages de l'administration</Text>
          {messages.map((m) => (
            <View key={m.id} style={s.msgCard}>
              <Text style={s.msgTitle}>{m.title}</Text>
              {m.body ? (
                <Text style={s.msgBody} numberOfLines={3}>
                  {m.body}
                </Text>
              ) : null}
              <Text style={s.msgDate}>
                {new Date(m.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ))}
        </>
      )}

      {children.length === 0 && (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>👨‍👩‍👧</Text>
          <Text style={s.emptyText}>Aucun enfant lié à votre compte.</Text>
          <Text style={s.emptyHint}>Contactez l'administration pour lier vos enfants.</Text>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  sub: { fontSize: 14, color: '#64748b', marginBottom: 18 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 3, textAlign: 'center' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },

  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#4f46e5' },
  childName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  childClass: { fontSize: 13, color: '#64748b', marginTop: 2 },
  chevron: { fontSize: 22, color: '#94a3b8' },

  eventCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4f46e5', marginTop: 5 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  eventMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },

  msgCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  msgTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  msgBody: { fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 19 },
  msgDate: { fontSize: 12, color: '#94a3b8', marginTop: 6 },

  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#334155' },
  emptyHint: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
})
