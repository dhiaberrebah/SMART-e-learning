import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'

import { supabase } from '@/lib/supabase'

type Student = {
  id: string
  full_name: string
  student_number: string | null
  date_of_birth: string | null
  class: { name: string; grade_level: string | null } | null
  parent: { full_name: string; email: string } | null
}

export default function AdminStudentsScreen() {
  const [students, setStudents] = useState<Student[]>([])
  const [filtered, setFiltered] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadStudents() {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, student_number, date_of_birth, class:classes(name, grade_level), parent:profiles!students_parent_id_fkey(full_name, email)')
      .order('full_name')
    const list = (data as Student[]) ?? []
    setStudents(list)
    setFiltered(list)
  }

  async function init() {
    setLoading(true)
    await loadStudents()
    setLoading(false)
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadStudents()
    setRefreshing(false)
  }

  useEffect(() => { void init() }, [])

  function onSearch(text: string) {
    setSearch(text)
    const q = text.toLowerCase()
    setFiltered(
      students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (s.student_number ?? '').includes(q) ||
          (s.class?.name ?? '').toLowerCase().includes(q)
      )
    )
  }

  const withClass = students.filter((s) => s.class).length
  const withoutClass = students.length - withClass

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    )
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
    >
      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNum}>{students.length}</Text>
          <Text style={s.statLbl}>Total</Text>
        </View>
        <View style={[s.statBox, { backgroundColor: '#dcfce7' }]}>
          <Text style={[s.statNum, { color: '#16a34a' }]}>{withClass}</Text>
          <Text style={s.statLbl}>En classe</Text>
        </View>
        <View style={[s.statBox, { backgroundColor: '#fef9c3' }]}>
          <Text style={[s.statNum, { color: '#a16207' }]}>{withoutClass}</Text>
          <Text style={s.statLbl}>Sans classe</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <FontAwesome name="search" size={14} color="#9ca3af" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Rechercher un élève…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={onSearch}
        />
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <FontAwesome name="graduation-cap" size={40} color="#d1d5db" />
          <Text style={s.emptyText}>Aucun élève trouvé</Text>
        </View>
      ) : (
        <View style={s.card}>
          {filtered.map((st, i) => (
            <View key={st.id} style={[s.row, i < filtered.length - 1 && s.rowBorder]}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{st.full_name?.charAt(0)}</Text>
              </View>
              <View style={s.rowBody}>
                <View style={s.rowTop}>
                  <Text style={s.rowName}>{st.full_name}</Text>
                  {st.class ? (
                    <View style={s.classBadge}>
                      <Text style={s.classBadgeText}>{st.class.name}</Text>
                    </View>
                  ) : (
                    <View style={s.noclassBadge}>
                      <Text style={s.noclassBadgeText}>Sans classe</Text>
                    </View>
                  )}
                </View>
                <View style={s.rowMeta}>
                  {st.student_number ? (
                    <Text style={s.metaText}>N° {st.student_number}</Text>
                  ) : null}
                  {st.date_of_birth ? (
                    <Text style={s.metaText}>
                      {new Date(st.date_of_birth).toLocaleDateString('fr-FR')}
                    </Text>
                  ) : null}
                  {st.parent ? (
                    <Text style={s.metaText}>{st.parent.full_name}</Text>
                  ) : (
                    <Text style={[s.metaText, { color: '#d97706' }]}>Parent non inscrit</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNum: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLbl: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#111827' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#6d28d9' },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  classBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  classBadgeText: { fontSize: 11, color: '#3730a3', fontWeight: '600' },
  noclassBadge: { backgroundColor: '#fef9c3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  noclassBadgeText: { fontSize: 11, color: '#a16207', fontWeight: '600' },
  rowMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  metaText: { fontSize: 12, color: '#6b7280' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
})
