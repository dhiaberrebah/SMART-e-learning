import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { useAuth } from '@/contexts/AuthContext'

type Announcement = {
  id: string
  title: string
  content: string | null
  event_date: string | null
  created_at: string
  author: { full_name: string } | null
}

export default function AdminAnnouncementsScreen() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', event_date: '' })

  async function loadAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, event_date, created_at, author:profiles!announcements_author_id_fkey(full_name)')
      .order('created_at', { ascending: false })
    setAnnouncements((data as Announcement[]) ?? [])
  }

  async function init() {
    setLoading(true)
    await loadAnnouncements()
    setLoading(false)
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadAnnouncements()
    setRefreshing(false)
  }

  useEffect(() => { void init() }, [])

  async function handleAdd() {
    if (!form.title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('announcements').insert({
      title: form.title.trim(),
      content: form.content.trim() || null,
      event_date: form.event_date.trim() || null,
      author_id: user!.id,
    })
    setSaving(false)
    if (error) {
      Alert.alert('Erreur', error.message)
      return
    }
    setForm({ title: '', content: '', event_date: '' })
    setModalVisible(false)
    await loadAnnouncements()
  }

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette annonce ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('announcements').delete().eq('id', id)
          setAnnouncements((prev) => prev.filter((a) => a.id !== id))
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    )
  }

  return (
    <View style={s.flex}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
      >
        {/* Header actions */}
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <FontAwesome name="plus" size={14} color="#fff" />
          <Text style={s.addBtnText}>Nouvelle annonce</Text>
        </TouchableOpacity>

        {announcements.length === 0 ? (
          <View style={s.empty}>
            <FontAwesome name="bullhorn" size={40} color="#d1d5db" />
            <Text style={s.emptyText}>Aucune annonce publiée</Text>
          </View>
        ) : (
          <View style={s.list}>
            {announcements.map((a) => (
              <View key={a.id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.iconWrap}>
                    <FontAwesome name="bullhorn" size={16} color="#dc2626" />
                  </View>
                  <View style={s.cardMeta}>
                    <Text style={s.cardTitle}>{a.title}</Text>
                    <Text style={s.cardSub}>
                      {a.author?.full_name ?? 'Admin'} ·{' '}
                      {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(a.id)} style={s.deleteBtn}>
                    <FontAwesome name="trash" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                {a.content ? <Text style={s.cardContent}>{a.content}</Text> : null}
                {a.event_date ? (
                  <View style={s.dateBadge}>
                    <FontAwesome name="calendar" size={11} color="#7c3aed" />
                    <Text style={s.dateBadgeText}>
                      Événement le {new Date(a.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
          <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nouvelle annonce</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Titre *</Text>
            <TextInput
              style={s.input}
              placeholder="Titre de l'annonce"
              placeholderTextColor="#9ca3af"
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            />

            <Text style={s.label}>Contenu</Text>
            <TextInput
              style={[s.input, s.textarea]}
              placeholder="Description ou message…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={form.content}
              onChangeText={(v) => setForm((f) => ({ ...f, content: v }))}
            />

            <Text style={s.label}>Date d'événement (optionnel)</Text>
            <TextInput
              style={s.input}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor="#9ca3af"
              value={form.event_date}
              onChangeText={(v) => setForm((f) => ({ ...f, event_date: v }))}
              keyboardType="numbers-and-punctuation"
            />

            <Pressable style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleAdd} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>Publier l'annonce</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'flex-end',
    marginBottom: 16,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  deleteBtn: { padding: 4 },
  cardContent: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#ede9fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dateBadgeText: { fontSize: 12, color: '#6d28d9', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
  modalContent: { padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textarea: { minHeight: 120, paddingTop: 12 },
  saveBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
