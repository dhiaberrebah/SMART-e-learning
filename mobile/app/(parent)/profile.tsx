import { router } from 'expo-router'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { useAuth } from '@/contexts/AuthContext'

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth()

  async function onSignOut() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{profile?.full_name ?? '—'}</Text>
        <Text style={[styles.label, styles.mt]}>E-mail</Text>
        <Text style={styles.value}>{user?.email ?? profile?.email ?? '—'}</Text>
      </View>

      <Pressable style={styles.button} onPress={onSignOut}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  value: { fontSize: 17, color: '#0f172a', marginTop: 4 },
  mt: { marginTop: 16 },
  button: {
    marginTop: 24,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#b91c1c', fontSize: 16, fontWeight: '600' },
})
