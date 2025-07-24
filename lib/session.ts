export interface Session {
  id: number
  user_id: number
  token: string
  expires_at: string
  created_at: string
}

export interface SessionUser {
  id: number
  username: string
  email: string
  role: string
  status: string
  is_verified: boolean
  is_profile_verified: boolean
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  created_at: string
  updated_at: string
  last_login_at?: string
}
