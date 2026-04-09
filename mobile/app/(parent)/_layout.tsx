import type { ComponentProps } from 'react'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Redirect, Tabs } from 'expo-router'

import { useAuth } from '@/contexts/AuthContext'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'

function TabIcon({ name, color }: { name: ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} name={name} color={color} style={{ marginBottom: -2 }} />
}

export default function ParentTabLayout() {
  const colorScheme = useColorScheme()
  const { session, profile, loading } = useAuth()
  const tint = Colors[colorScheme ?? 'light'].tint

  if (!loading && (!session || profile?.role !== 'parent')) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Mes enfants',
          tabBarLabel: 'Enfants',
          tabBarIcon: ({ color }) => <TabIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => <TabIcon name="envelope" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  )
}
