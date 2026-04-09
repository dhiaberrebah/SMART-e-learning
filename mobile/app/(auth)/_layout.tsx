import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerBackTitle: 'Retour' }}>
      <Stack.Screen name="login" options={{ title: 'Connexion', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Inscription', headerShown: false }} />
    </Stack>
  )
}
