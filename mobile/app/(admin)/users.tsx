import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'

import { supabase } from '@/lib/supabase'

type User = {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

type RoleFilter = 'all' | 'teacher' | 'parent' | 'admin'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Enseignant',
  parent: 'Parent',
}

const ROLE_COLORS: Record<string, [string, string]> = {
  admin: ['#fee2e2', '#dc2626'],
  teacher: ['#dcfce7', '#16a34a'],
  parent: ['#dbeafe', '#2563eb'],
}

const FILTERS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'teacher', label: 'Enseignants' },
  { key: 'parent', label: 'Parents' },
  { key: 'admin', label: 'Admins' },
]

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false })
    setUsers((data as User[]) ?? [])
  }

  function applyFilters(list: User[], q: string, role: RoleFilter) {
    return list.filter((u) => {
      const matchRole = role === 'all' || u.role === role
      const matchQ = q === '' || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      return matchRole && matchQ
    })
  }

  useEffect(() => {
    setFiltered(applyFilters(users, search.toLowerCase(), roleFilter))
  }, [users, search, roleFilter])

  async function init() {
    setLoading(true)
    await loadUsers()
    setLoading(false)
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadUsers()
    setRefreshing(false)
  }

  useEffect(() => { void init() }, [])

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    )
  }

  const counts = {
    all: users.length,
    teacher: users.filter((u) => u.role === 'teacher').length,
    parent: users.filter((u) => u.role === 'parent').length,
    admin: users.filter((u) => u.role === 'admin').length,
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
    >
      {/* Stats */}
      <View style={s.statsRow}>
        {(['teacher', 'parent', 'admin'] as const).map((r) => {
          const [bg, tx] = ROLE_COLORS[r]
          return (
            <View key={r} style={[s.statBox, { backgroundColor: bg }]}>
              <Text style={[s.statNum, { color: tx }]}>{counts[r]}</Text>
              <Text style={[s.statLbl, { color: tx }]}>{ROLE_LABELS[r]}s</Text>
            </View>
          )
        })}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <FontAwesome name="search" size={14} color="#9ca3af" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Rechercher un utilisateur…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Role filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, roleFilter === f.key && s.filterBtnActive]}
            onPress={() => setRoleFilter(f.key)}
          >
            <Text style={[s.filterText, roleFilter === f.key && s.filterTextActive]}>
              {f.label} ({counts[f.key]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <FontAwesome name="users" size={40} color="#d1d5db" />
          <Text style={s.emptyText}>Aucun utilisateur trouvé</Text>
        </View>
      ) : (
        <View style={s.card}>
          {filtered.map((u, i) => {
            const [bg, tx] = ROLE_COLORS[u.role] ?? ['#f3f4f6', '#6b7280']
            return (
              <View key={u.id} style={[s.row, i < filtered.length - 1 && s.rowBorder]}>
                <View style={[s.avatar, { backgroundColor: bg }]}>
                  <Text style={[s.avatarText, { color: tx }]}>{u.full_name?.charAt(0)}</Text>
                </View>
                <View style={s.rowBody}>
                  <View style={s.rowTop}>
                    <Text style={s.rowName} numberOfLines={1}>{u.full_name}</Text>
                    <View style={[s.roleBadge, { backgroundColor: bg }]}>
                      <Text style={[s.roleBadgeText, { color: tx }]}>{ROLE_LABELS[u.role] ?? u.role}</Text>
                    </View>
                  </View>
                  <Text style={s.rowEmail} numberOfLines={1}>{u.email}</Text>
                  <Text style={s.rowDate}>
                    Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            )
          })}
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
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 11, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#111827' },
  filterScroll: { marginBottom: 14 },
  filterRow: { gap: 8, paddingRight: 4 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  filterBtnActive: { backgroundColor: '#dc2626' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
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
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
  rowEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rowDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
})
