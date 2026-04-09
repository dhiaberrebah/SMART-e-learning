import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Row = {
  id: string
  full_name: string
  student_number?: string | null
  class?: { name: string; grade_level?: string | null } | { name: string; grade_level?: string | null }[] | null
}

export default function ChildrenScreen() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('students')
      .select('id, full_name, student_number, class:classes(name, grade_level)')
      .eq('parent_id', user.id)
      .order('full_name')
    setRows((data as Row[]) ?? [])
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

  function cls(r: Row) {
    const c = r.class
    if (!c) return null
    if (Array.isArray(c)) return c[0]
    return c
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {rows.length === 0 ? (
        <Text style={styles.empty}>Aucun enfant lié à votre compte.</Text>
      ) : (
        rows.map((r) => {
          const c = cls(r)
          return (
            <View key={r.id} style={styles.card}>
              <Text style={styles.name}>{r.full_name}</Text>
              {r.student_number ? <Text style={styles.meta}>N° {r.student_number}</Text> : null}
              {c ? (
                <Text style={styles.meta}>
                  {c.name}
                  {c.grade_level ? ` · ${c.grade_level}` : ''}
                </Text>
              ) : null}
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 32, fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  name: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
  meta: { fontSize: 14, color: '#64748b', marginTop: 4 },
})
