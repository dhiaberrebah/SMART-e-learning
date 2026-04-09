import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'

type Msg = { id: string; title: string; created_at: string }

export default function MessagesScreen() {
  const [rows, setRows] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('admin_broadcast_messages')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    setRows((data as Msg[]) ?? [])
  }, [])

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {rows.length === 0 ? (
        <Text style={styles.empty}>Aucun message pour le moment.</Text>
      ) : (
        rows.map((m) => (
          <View key={m.id} style={styles.card}>
            <Text style={styles.title}>{m.title}</Text>
            <Text style={styles.date}>
              {new Date(m.created_at).toLocaleString('fr-FR', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  date: { fontSize: 13, color: '#64748b', marginTop: 6 },
})
