"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: number
  username: string
  email: string
  role: string
  status: string
  is_verified: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isOwner: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication status
  const checkAuth = async () => {
    console.log("🔄 [AUTH-CONTEXT] Checking authentication status")

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("🔍 [AUTH-CONTEXT] Auth check response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ [AUTH-CONTEXT] Auth check successful:", data.user?.username)

        if (data.success && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        console.log("❌ [AUTH-CONTEXT] Auth check failed:", response.status)
        setUser(null)
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Auth check error:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string) => {
    console.log("🔐 [AUTH-CONTEXT] Attempting login for:", email)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("🔍 [AUTH-CONTEXT] Login response:", {
        status: response.status,
        success: data.success,
        message: data.message,
      })

      if (data.success && data.user) {
        console.log("✅ [AUTH-CONTEXT] Login successful:", data.user.username)
        setUser(data.user)
        return { success: true, message: data.message }
      } else {
        console.log("❌ [AUTH-CONTEXT] Login failed:", data.message)
        return { success: false, message: data.message || "Login failed" }
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Login error:", error)
      return { success: false, message: "Network error occurred" }
    }
  }

  // Logout function
  const logout = async () => {
    console.log("🚪 [AUTH-CONTEXT] Logging out user")

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("🔍 [AUTH-CONTEXT] Logout response:", {
        status: response.status,
        success: data.success,
      })

      if (data.success) {
        console.log("✅ [AUTH-CONTEXT] Logout successful")
        setUser(null)
      } else {
        console.log("❌ [AUTH-CONTEXT] Logout failed:", data.message)
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Logout error:", error)
    }

    // Always clear user state on logout attempt
    setUser(null)
  }

  // Check auth on mount
  useEffect(() => {
    console.log("🔄 [AUTH-CONTEXT] AuthProvider mounted, checking auth")
    checkAuth()
  }, [])

  // Computed values
  const isAuthenticated = !!user
  const isAdmin = user?.role === "admin" || user?.role === "owner"
  const isOwner = user?.role === "owner"

  console.log("🔍 [AUTH-CONTEXT] Current auth state:", {
    hasUser: !!user,
    username: user?.username,
    role: user?.role,
    isAuthenticated,
    isAdmin,
    isOwner,
    loading,
  })

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated,
    isAdmin,
    isOwner,
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
