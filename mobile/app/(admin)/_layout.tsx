import type { ComponentProps } from 'react'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Redirect, Tabs } from 'expo-router'

import { useAuth } from '@/contexts/AuthContext'

function TabIcon({ name, color }: { name: ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={20} name={name} color={color} style={{ marginBottom: -2 }} />
}

export default function AdminTabLayout() {
  const { session, profile, loading } = useAuth()

  if (!loading && (!session || profile?.role !== 'admin')) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
        headerStyle: { backgroundColor: '#dc2626' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Élèves',
          tabBarIcon: ({ color }) => <TabIcon name="graduation-cap" color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          tabBarLabel: 'Utilisateurs',
          tabBarIcon: ({ color }) => <TabIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color }) => <TabIcon name="building" color={color} />,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Événements',
          tabBarLabel: 'Annonces',
          tabBarIcon: ({ color }) => <TabIcon name="bullhorn" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon name="user-circle" color={color} />,
        }}
      />
    </Tabs>
  )
}
