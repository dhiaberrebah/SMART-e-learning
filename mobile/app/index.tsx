import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { useAuth } from '@/contexts/AuthContext'

export default function Index() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  if (profile?.role === 'admin') {
    return <Redirect href="/(admin)" />
  }

  if (profile?.role !== 'parent') {
    return <Redirect href="/(auth)/login" />
  }

  return <Redirect href="/(parent)" />
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
})
