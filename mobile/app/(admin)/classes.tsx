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

type ClassRow = {
  id: string
  name: string
  grade_level: string | null
  academic_year: string | null
  teacher: { full_name: string } | null
  student_count: number
}

export default function AdminClassesScreen() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [filtered, setFiltered] = useState<ClassRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadClasses() {
    const { data: classesRaw } = await supabase
      .from('classes')
      .select('id, name, grade_level, academic_year, teacher:profiles!classes_teacher_id_fkey(full_name)')
      .order('name')

    const ids = (classesRaw ?? []).map((c: any) => c.id)
    const { data: counts } = await supabase
      .from('students')
      .select('class_id')
      .in('class_id', ids.length > 0 ? ids : ['none'])

    const countMap: Record<string, number> = {}
    ;(counts ?? []).forEach((s: any) => {
      countMap[s.class_id] = (countMap[s.class_id] ?? 0) + 1
    })

    const list: ClassRow[] = (classesRaw ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      grade_level: c.grade_level,
      academic_year: c.academic_year,
      teacher: c.teacher,
      student_count: countMap[c.id] ?? 0,
    }))

    setClasses(list)
    setFiltered(list)
  }

  function onSearch(text: string) {
    setSearch(text)
    const q = text.toLowerCase()
    setFiltered(
      classes.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.grade_level ?? '').toLowerCase().includes(q) ||
          (c.teacher?.full_name ?? '').toLowerCase().includes(q)
      )
    )
  }

  async function init() {
    setLoading(true)
    await loadClasses()
    setLoading(false)
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadClasses()
    setRefreshing(false)
  }

  useEffect(() => { void init() }, [])

  const totalStudents = classes.reduce((sum, c) => sum + c.student_count, 0)
  const avgPerClass = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0

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
          <Text style={s.statNum}>{classes.length}</Text>
          <Text style={s.statLbl}>Classes</Text>
        </View>
        <View style={[s.statBox, { backgroundColor: '#ede9fe' }]}>
          <Text style={[s.statNum, { color: '#6d28d9' }]}>{totalStudents}</Text>
          <Text style={[s.statLbl, { color: '#6d28d9' }]}>Élèves total</Text>
        </View>
        <View style={[s.statBox, { backgroundColor: '#dcfce7' }]}>
          <Text style={[s.statNum, { color: '#16a34a' }]}>{avgPerClass}</Text>
          <Text style={[s.statLbl, { color: '#16a34a' }]}>Moy./classe</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <FontAwesome name="search" size={14} color="#9ca3af" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Rechercher une classe…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={onSearch}
        />
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <FontAwesome name="building" size={40} color="#d1d5db" />
          <Text style={s.emptyText}>Aucune classe trouvée</Text>
        </View>
      ) : (
        <View style={s.card}>
          {filtered.map((c, i) => (
            <View key={c.id} style={[s.row, i < filtered.length - 1 && s.rowBorder]}>
              <View style={s.iconWrap}>
                <FontAwesome name="building" size={18} color="#7c3aed" />
              </View>
              <View style={s.rowBody}>
                <View style={s.rowTop}>
                  <Text style={s.rowName}>{c.name}</Text>
                  <View style={s.countBadge}>
                    <Text style={s.countText}>{c.student_count} élève{c.student_count !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <View style={s.rowMeta}>
                  {c.grade_level ? <Text style={s.metaText}>Niveau : {c.grade_level}</Text> : null}
                  {c.academic_year ? <Text style={s.metaText}>{c.academic_year}</Text> : null}
                  {c.teacher ? (
                    <Text style={s.metaText}>Prof : {c.teacher.full_name}</Text>
                  ) : (
                    <Text style={[s.metaText, { color: '#d97706' }]}>Aucun enseignant</Text>
                  )}
                </View>
                {/* Progress bar */}
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${Math.min((c.student_count / Math.max(...classes.map(x => x.student_count), 1)) * 100, 100)}%` }]} />
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
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  countBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  countText: { fontSize: 11, color: '#3730a3', fontWeight: '600' },
  rowMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#6b7280' },
  barBg: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 99 },
  barFill: { height: 4, backgroundColor: '#7c3aed', borderRadius: 99 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
})
