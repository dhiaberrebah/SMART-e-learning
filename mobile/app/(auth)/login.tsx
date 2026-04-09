import { Link, router } from 'expo-router'
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

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  const { refreshProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setError('')
    setLoading(true)
    try {
      const { data, error: signErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (signErr) throw signErr
      if (!data.user) throw new Error('Connexion impossible')

      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (pErr) throw pErr
      if (prof?.role !== 'parent') {
        await supabase.auth.signOut()
        throw new Error('Ce compte n’est pas un compte parent.')
      }

      await refreshProfile()
      router.replace('/(parent)')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur de connexion'
      setError(msg)
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
          <Text style={styles.badge}>Espace parent</Text>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.sub}>SMART e-Learning — suivez la scolarité de vos enfants</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.com"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
          </Pressable>

          <Link href="/(auth)/register" asChild>
            <Pressable style={styles.linkWrap}>
              <Text style={styles.link}>Créer un compte parent</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#eef2ff' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
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
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginTop: 16 },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  error: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
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
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: '#4f46e5', fontSize: 15, fontWeight: '600' },
})
