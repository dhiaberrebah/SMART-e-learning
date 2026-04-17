import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function AdminProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile!.id)
    setSaving(false)
    if (error) {
      Alert.alert('Erreur', error.message)
      return
    }
    await refreshProfile()
    setEditing(false)
  }

  async function handleSignOut() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          await signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'A'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.content}>
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{profile?.full_name}</Text>
          <View style={s.roleBadge}>
            <FontAwesome name="shield" size={12} color="#dc2626" />
            <Text style={s.roleText}>Administrateur</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Informations du compte</Text>

          <View style={s.infoRow}>
            <View style={s.infoIcon}>
              <FontAwesome name="envelope" size={14} color="#6b7280" />
            </View>
            <View style={s.infoBody}>
              <Text style={s.infoLabel}>E-mail</Text>
              <Text style={s.infoValue}>{profile?.email}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.infoRow}>
            <View style={s.infoIcon}>
              <FontAwesome name="user" size={14} color="#6b7280" />
            </View>
            <View style={s.infoBody}>
              <Text style={s.infoLabel}>Rôle</Text>
              <Text style={s.infoValue}>Administrateur</Text>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.infoRow}>
            <View style={s.infoIcon}>
              <FontAwesome name="id-card" size={14} color="#6b7280" />
            </View>
            <View style={s.infoBody}>
              <Text style={s.infoLabel}>Identifiant</Text>
              <Text style={[s.infoValue, s.mono]}>{profile?.id?.slice(0, 8)}…</Text>
            </View>
          </View>
        </View>

        {/* Edit name */}
        {editing ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Modifier le nom</Text>
            <TextInput
              style={s.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nom complet"
              placeholderTextColor="#9ca3af"
            />
            <View style={s.editActions}>
              <Pressable style={s.cancelBtn} onPress={() => { setEditing(false); setFullName(profile?.full_name ?? '') }}>
                <Text style={s.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable style={[s.saveBtn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Enregistrer</Text>}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={s.editRow} onPress={() => setEditing(true)}>
            <FontAwesome name="pencil" size={14} color="#dc2626" />
            <Text style={s.editRowText}>Modifier mon nom</Text>
            <FontAwesome name="chevron-right" size={12} color="#d1d5db" style={{ marginLeft: 'auto' }} />
          </Pressable>
        )}

        {/* Logout */}
        <Pressable
          style={[s.logoutBtn, signingOut && s.btnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome name="sign-out" size={16} color="#fff" />
              <Text style={s.logoutText}>Se déconnecter</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleText: { fontSize: 13, color: '#dc2626', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  infoValue: { fontSize: 15, color: '#111827', fontWeight: '500', marginTop: 1 },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 14,
  },
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  editRowText: { fontSize: 15, color: '#dc2626', fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
