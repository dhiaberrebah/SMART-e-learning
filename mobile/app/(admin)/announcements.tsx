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

type EventRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  start_at: string
  end_at: string | null
  created_at: string
  creator?: { full_name?: string | null } | null
}

/** Compatible avec champ `datetime-local` du web ; envoi en ISO pour Supabase. */
function combineToIsoUtc(dateYYYYMMDD: string, timeHHMM: string): string {
  const date = dateYYYYMMDD.trim() || new Date().toISOString().slice(0, 10)
  const m = timeHHMM.trim().match(/^(\d{1,2}):(\d{2})$/)
  const h = m ? String(Math.min(23, parseInt(m[1], 10))).padStart(2, '0') : '09'
  const min = m ? String(Math.min(59, parseInt(m[2], 10))).padStart(2, '0') : '00'
  const local = new Date(`${date}T${h}:${min}:00`)
  return Number.isNaN(local.getTime()) ? new Date().toISOString() : local.toISOString()
}

export default function AdminAnnouncementsScreen() {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshingRaw, setRefreshingRaw] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '09:00',
  })

  async function loadEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
        id,
        title,
        description,
        location,
        start_at,
        end_at,
        created_at,
        creator:profiles!events_created_by_fkey(full_name)
      `
      )
      .order('start_at', { ascending: false })
    if (error) {
      setLoadError(error.message)
      setEvents([])
      return
    }
    setLoadError(null)
    setEvents((data as EventRow[]) ?? [])
  }

  async function init() {
    setLoading(true)
    await loadEvents()
    setLoading(false)
  }

  async function onRefresh() {
    setRefreshingRaw(true)
    await loadEvents()
    setRefreshingRaw(false)
  }

  useEffect(() => {
    void init()
  }, [])

  async function handleAdd() {
    if (!form.title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire.')
      return
    }
    if (!user?.id) {
      Alert.alert('Erreur', 'Session invalide.')
      return
    }
    setSaving(true)
    const start_at = combineToIsoUtc(form.date, form.time)

    const { error } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      start_at,
      end_at: null,
      created_by: user.id,
    })

    setSaving(false)
    if (error) {
      Alert.alert('Erreur', error.message)
      return
    }

    setForm({ title: '', description: '', location: '', date: '', time: '09:00' })
    setModalVisible(false)
    await loadEvents()
  }

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Supprimer cet événement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('event_targets').delete().eq('event_id', id)
          const { error } = await supabase.from('events').delete().eq('id', id)
          if (error) {
            Alert.alert('Erreur', error.message)
            return
          }
          setEvents((prev) => prev.filter((e) => e.id !== id))
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
        refreshControl={<RefreshControl refreshing={refreshingRaw} onRefresh={onRefresh} tintColor="#dc2626" />}
      >
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <FontAwesome name="plus" size={14} color="#fff" />
          <Text style={s.addBtnText}>Nouvel événement</Text>
        </TouchableOpacity>

        {loadError ? (
          <View style={s.errorBox}>
            <Text style={s.errorTitle}>Impossible de charger les événements</Text>
            <Text style={s.errorMsg}>{loadError}</Text>
          </View>
        ) : null}

        {events.length === 0 && !loadError ? (
          <View style={s.empty}>
            <FontAwesome name="calendar" size={40} color="#d1d5db" />
            <Text style={s.emptyText}>Aucun événement</Text>
          </View>
        ) : (
          <View style={s.list}>
            {events.map((ev) => {
              const start = new Date(ev.start_at)
              return (
                <View key={ev.id} style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={s.iconWrap}>
                      <FontAwesome name="bullhorn" size={16} color="#dc2626" />
                    </View>
                    <View style={s.cardMeta}>
                      <Text style={s.cardTitle}>{ev.title}</Text>
                      <Text style={s.cardSub}>
                        {ev.creator?.full_name ?? 'Administrateur'} ·{' '}
                        {start.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}{' '}
                        · {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(ev.id)} style={s.deleteBtn}>
                      <FontAwesome name="trash" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  {ev.description ? <Text style={s.cardContent}>{ev.description}</Text> : null}
                  {ev.location ? (
                    <View style={s.locationRow}>
                      <FontAwesome name="map-marker" size={12} color="#64748b" style={s.locationIcon} />
                      <Text style={s.location}>{ev.location}</Text>
                    </View>
                  ) : null}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
          <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nouvel événement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={s.helper}>Aligné avec l&apos;espace admin web (table événements).</Text>

            <Text style={s.label}>Titre *</Text>
            <TextInput
              style={s.input}
              placeholder="Ex. Réunion parents-enseignants"
              placeholderTextColor="#9ca3af"
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            />

            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.textarea]}
              placeholder="Détails…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            />

            <Text style={s.label}>Lieu (optionnel)</Text>
            <TextInput
              style={s.input}
              placeholder="Salle A, gymnase…"
              placeholderTextColor="#9ca3af"
              value={form.location}
              onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
            />

            <Text style={s.label}>Date du début *</Text>
            <TextInput
              style={s.input}
              placeholder="AAAA-MM-JJ (vide = aujourd’hui)"
              placeholderTextColor="#9ca3af"
              value={form.date}
              onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={s.label}>Heure (HH:MM)</Text>
            <TextInput
              style={s.input}
              placeholder="09:00"
              placeholderTextColor="#9ca3af"
              value={form.time}
              onChangeText={(v) => setForm((f) => ({ ...f, time: v }))}
            />

            <Pressable style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={() => void handleAdd()} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Créer l&apos;événement</Text>}
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
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  errorTitle: { fontWeight: '700', color: '#991b1b', fontSize: 14 },
  errorMsg: { color: '#7f1d1d', fontSize: 13 },
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
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  locationIcon: { marginTop: 1 },
  location: { fontSize: 13, color: '#64748b', flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
  modalContent: { padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  helper: { fontSize: 12, color: '#64748b', marginBottom: 16 },
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
