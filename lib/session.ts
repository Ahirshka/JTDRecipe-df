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
  email_verified: boolean
  avatar?: string
  created_at: string
  last_login_at?: string
}
