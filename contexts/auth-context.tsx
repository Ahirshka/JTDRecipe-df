"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
  status: string
  is_verified: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Checking authentication status")

      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      const data = await response.json()
      console.log("📝 [AUTH-CONTEXT] Auth check response:", data)

      if (data.success && data.user) {
        setUser(data.user)
        console.log("✅ [AUTH-CONTEXT] User authenticated:", data.user.username)
      } else {
        console.log("❌ [AUTH-CONTEXT] User not authenticated")
        setUser(null)
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Auth check failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Attempting login for:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("📝 [AUTH-CONTEXT] Login response:", data)

      if (data.success && data.user) {
        setUser(data.user)
        console.log("✅ [AUTH-CONTEXT] Login successful:", data.user.username)
        return { success: true }
      } else {
        console.log("❌ [AUTH-CONTEXT] Login failed:", data.error)
        return { success: false, error: data.error || "Login failed" }
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Login error:", error)
      return { success: false, error: "Network error" }
    }
  }

  const logout = async () => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Logging out")

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      console.log("✅ [AUTH-CONTEXT] Logout successful")
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Logout error:", error)
    } finally {
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
