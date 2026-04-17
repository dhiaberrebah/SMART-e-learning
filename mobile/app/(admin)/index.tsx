import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Stats = {
  totalUsers: number
  teachers: number
  parents: number
  admins: number
  totalStudents: number
  totalClasses: number
  studentsWithClass: number
}

type RecentUser = { id: string; full_name: string; email: string; role: string }
type RecentStudent = { id: string; full_name: string; student_number: string | null; class: { name: string } | null }

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadData() {
    const [
      { count: totalUsers },
      { count: teachers },
      { count: parents },
      { count: admins },
      { count: totalStudents },
      { count: totalClasses },
      { count: studentsWithClass },
      { data: ru },
      { data: rs },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('classes').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }).not('class_id', 'is', null),
      supabase.from('profiles').select('id, full_name, email, role').order('created_at', { ascending: false }).limit(5),
      supabase.from('students').select('id, full_name, student_number, class:classes(name)').order('created_at', { ascending: false }).limit(5),
    ])

    setStats({
      totalUsers: totalUsers ?? 0,
      teachers: teachers ?? 0,
      parents: parents ?? 0,
      admins: admins ?? 0,
      totalStudents: totalStudents ?? 0,
      totalClasses: totalClasses ?? 0,
      studentsWithClass: studentsWithClass ?? 0,
    })
    setRecentUsers((ru as RecentUser[]) ?? [])
    setRecentStudents((rs as any[]) ?? [])
  }

  async function init() {
    setLoading(true)
    await loadData()
    setLoading(false)
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  useEffect(() => { void init() }, [])

  const roleLabel = (r: string) =>
    ({ admin: 'Admin', teacher: 'Enseignant', parent: 'Parent' }[r] ?? r)

  const roleBg = (r: string): [string, string] =>
    ({ admin: ['#fee2e2', '#dc2626'], teacher: ['#dcfce7', '#16a34a'], parent: ['#dbeafe', '#2563eb'] }[r] ?? ['#f3f4f6', '#6b7280'])

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    )
  }

  const statCards = [
    { label: 'Utilisateurs', value: stats!.totalUsers, icon: 'users' as const, bg: '#4f46e5', dest: 'users' },
    { label: 'Enseignants', value: stats!.teachers, icon: 'book' as const, bg: '#16a34a', dest: 'users' },
    { label: 'Parents', value: stats!.parents, icon: 'user' as const, bg: '#2563eb', dest: 'users' },
    { label: 'Élèves', value: stats!.totalStudents, icon: 'graduation-cap' as const, bg: '#7c3aed', dest: 'students' },
    { label: 'Classes', value: stats!.totalClasses, icon: 'building' as const, bg: '#d97706', dest: 'classes' },
    { label: 'Admins', value: stats!.admins, icon: 'shield' as const, bg: '#dc2626', dest: 'users' },
  ]

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
    >
      {/* Welcome */}
      <View style={s.welcomeCard}>
        <Text style={s.welcomeTitle}>Tableau de bord admin</Text>
        <Text style={s.welcomeSub}>
          Bienvenue, {profile?.full_name?.split(' ')[0] ?? 'Admin'} —{' '}
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      {/* Stats grid */}
      <Text style={s.sectionTitle}>Vue d'ensemble</Text>
      <View style={s.grid}>
        {statCards.map((c) => (
          <TouchableOpacity key={c.label} style={s.statCard} onPress={() => router.push(`/(admin)/${c.dest}` as any)}>
            <View style={[s.statIcon, { backgroundColor: c.bg }]}>
              <FontAwesome name={c.icon} size={16} color="#fff" />
            </View>
            <Text style={s.statValue}>{c.value}</Text>
            <Text style={s.statLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary banners */}
      <View style={s.bannerRow}>
        <View style={[s.banner, { backgroundColor: '#4f46e5' }]}>
          <Text style={s.bannerNum}>{stats!.studentsWithClass}</Text>
          <Text style={s.bannerLabel}>Élèves en classe</Text>
          <Text style={s.bannerSub}>sur {stats!.totalStudents} total</Text>
        </View>
        <View style={[s.banner, { backgroundColor: '#16a34a' }]}>
          <Text style={s.bannerNum}>
            {stats!.totalClasses > 0 ? Math.round(stats!.totalStudents / stats!.totalClasses) : 0}
          </Text>
          <Text style={s.bannerLabel}>Moy. élèves</Text>
          <Text style={s.bannerSub}>par classe</Text>
        </View>
      </View>

      {/* Recent users */}
      <Text style={s.sectionTitle}>Derniers utilisateurs</Text>
      <View style={s.card}>
        {recentUsers.length === 0 ? (
          <Text style={s.empty}>Aucun utilisateur</Text>
        ) : (
          recentUsers.map((u, i) => {
            const [bgC, txC] = roleBg(u.role)
            return (
              <View key={u.id} style={[s.row, i < recentUsers.length - 1 && s.rowBorder]}>
                <View style={[s.avatar, { backgroundColor: '#e0e7ff' }]}>
                  <Text style={[s.avatarText, { color: '#3730a3' }]}>{u.full_name?.charAt(0)}</Text>
                </View>
                <View style={s.rowInfo}>
                  <Text style={s.rowName}>{u.full_name}</Text>
                  <Text style={s.rowSub}>{u.email}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: bgC }]}>
                  <Text style={[s.badgeText, { color: txC }]}>{roleLabel(u.role)}</Text>
                </View>
              </View>
            )
          })
        )}
        <TouchableOpacity style={s.seeAll} onPress={() => router.push('/(admin)/users' as any)}>
          <Text style={s.seeAllText}>Voir tous les utilisateurs →</Text>
        </TouchableOpacity>
      </View>

      {/* Recent students */}
      <Text style={s.sectionTitle}>Derniers élèves inscrits</Text>
      <View style={s.card}>
        {recentStudents.length === 0 ? (
          <Text style={s.empty}>Aucun élève</Text>
        ) : (
          recentStudents.map((st, i) => (
            <View key={st.id} style={[s.row, i < recentStudents.length - 1 && s.rowBorder]}>
              <View style={[s.avatar, { backgroundColor: '#ede9fe' }]}>
                <Text style={[s.avatarText, { color: '#6d28d9' }]}>{st.full_name?.charAt(0)}</Text>
              </View>
              <View style={s.rowInfo}>
                <Text style={s.rowName}>{st.full_name}</Text>
                <Text style={s.rowSub}>N° {st.student_number ?? '—'}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: '#e0e7ff' }]}>
                <Text style={[s.badgeText, { color: '#3730a3' }]}>{st.class?.name ?? 'Sans classe'}</Text>
              </View>
            </View>
          ))
        )}
        <TouchableOpacity style={s.seeAll} onPress={() => router.push('/(admin)/students' as any)}>
          <Text style={s.seeAllText}>Voir tous les élèves →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  welcomeCard: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  welcomeSub: { fontSize: 13, color: '#fecaca', marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    width: '31%',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  bannerRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  banner: { flex: 1, borderRadius: 14, padding: 16 },
  bannerNum: { fontSize: 28, fontWeight: '800', color: '#fff' },
  bannerLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: 2 },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowSub: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  seeAll: { padding: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  seeAllText: { fontSize: 13, color: '#dc2626', fontWeight: '600' },
  empty: { padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 14 },
})
