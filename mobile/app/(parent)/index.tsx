import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type ChildRow = {
  id: string
  full_name: string
  class?: { name: string } | { name: string }[] | null
}

export default function ParentHomeScreen() {
  const { user } = useAuth()
  const [children, setChildren] = useState<ChildRow[]>([])
  const [msgCount, setMsgCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    const [{ data: kids }, { count }] = await Promise.all([
      supabase
        .from('students')
        .select('id, full_name, class:classes(name)')
        .eq('parent_id', user.id)
        .order('full_name'),
      supabase.from('admin_broadcast_messages').select('id', { count: 'exact', head: true }),
    ])
    setChildren((kids as ChildRow[]) ?? [])
    setMsgCount(count ?? 0)
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  function className(c: ChildRow): string {
    const cl = c.class
    if (!cl) return '—'
    if (Array.isArray(cl)) return cl[0]?.name ?? '—'
    return cl.name ?? '—'
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.h1}>Tableau de bord</Text>
      <Text style={styles.muted}>Résumé pour votre famille</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Enfants suivis</Text>
        <Text style={styles.cardStat}>{children.length}</Text>
        {children.length === 0 ? (
          <Text style={styles.muted}>Aucun élève lié à ce compte pour l’instant.</Text>
        ) : (
          children.map((c) => (
            <Text key={c.id} style={styles.line}>
              • {c.full_name} — {className(c)}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Messages administration</Text>
        <Text style={styles.cardStat}>{msgCount ?? '—'}</Text>
        <Text style={styles.muted}>Consultez l’onglet Messages pour la liste.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  h1: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  muted: { fontSize: 14, color: '#64748b', marginTop: 6 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  cardStat: { fontSize: 32, fontWeight: '700', color: '#4f46e5', marginVertical: 8 },
  line: { fontSize: 15, color: '#334155', marginTop: 6 },
})
