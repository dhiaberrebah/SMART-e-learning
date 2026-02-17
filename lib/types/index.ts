export type UserRole = 'teacher' | 'parent' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile?: Profile
}
