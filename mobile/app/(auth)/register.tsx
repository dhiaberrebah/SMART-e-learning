import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { supabase } from '@/lib/supabase'
import { normalizeParentCin } from '@/lib/parent-cin'

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [cin, setCin] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setError('')
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    const cinNorm = normalizeParentCin(cin)
    if (!cinNorm || cinNorm.length < 5) {
      setError('CIN invalide (minimum 5 caractères).')
      return
    }

    setLoading(true)
    try {
      const { error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'parent',
            cin: cinNorm,
          },
        },
      })
      if (signErr) throw signErr
      router.replace('/(parent)')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Inscription impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Compte parent</Text>
          <Text style={styles.sub}>Même compte que sur le site web (e-mail + CIN)</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Nom complet</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Prénom Nom" />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.com"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>CIN</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="characters"
            value={cin}
            onChangeText={setCin}
            placeholder="Numéro CIN"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 6 caractères"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Confirmer</Text>
          <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S’inscrire</Text>}
          </Pressable>

          <Pressable style={styles.linkWrap} onPress={() => router.back()}>
            <Text style={styles.link}>Déjà un compte ? Connexion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#eef2ff' },
  scroll: { padding: 24, paddingVertical: 48 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  error: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    color: '#b91c1c',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: '#4f46e5', fontSize: 15, fontWeight: '600' },
})
