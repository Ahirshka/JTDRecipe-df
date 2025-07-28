"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: number
  username: string
  email: string
  role: string
  status: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Check authentication status
  const checkAuth = async () => {
    console.log("🔍 [AUTH-CONTEXT] Checking authentication status...")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      console.log("📡 [AUTH-CONTEXT] Auth check response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📡 [AUTH-CONTEXT] Auth check response data:", data)

        if (data.success && data.user) {
          console.log("✅ [AUTH-CONTEXT] User authenticated:", {
            id: data.user.id,
            username: data.user.username,
            role: data.user.role,
          })
          setUser(data.user)
        } else {
          console.log("❌ [AUTH-CONTEXT] No authenticated user found")
          setUser(null)
        }
      } else {
        console.log("❌ [AUTH-CONTEXT] Auth check failed with status:", response.status)
        const errorData = await response.json().catch(() => ({}))
        console.log("❌ [AUTH-CONTEXT] Error details:", errorData)
        setUser(null)
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Auth check error:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
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

      console.log("📡 [AUTH-CONTEXT] Login response status:", response.status)

      const data = await response.json()
      console.log("📡 [AUTH-CONTEXT] Login response data:", data)

      if (data.success && data.user) {
        console.log("✅ [AUTH-CONTEXT] Login successful:", {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
        })
        setUser(data.user)

        // Force a re-check of auth status to ensure cookies are working
        setTimeout(() => {
          checkAuth()
        }, 100)

        return { success: true, message: data.message || "Login successful" }
      } else {
        console.log("❌ [AUTH-CONTEXT] Login failed:", data.error || data.message)
        setUser(null)
        return { success: false, message: data.error || data.message || "Login failed" }
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Login error:", error)
      setUser(null)
      return { success: false, message: "Network error during login" }
    }
  }

  // Logout function
  const logout = async () => {
    console.log("🚪 [AUTH-CONTEXT] Logging out user...")

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      console.log("📡 [AUTH-CONTEXT] Logout response status:", response.status)

      const data = await response.json()
      console.log("📡 [AUTH-CONTEXT] Logout response data:", data)

      if (data.success) {
        console.log("✅ [AUTH-CONTEXT] Logout successful")
      } else {
        console.log("⚠️ [AUTH-CONTEXT] Logout response not successful, but clearing user anyway")
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Logout error:", error)
    } finally {
      // Always clear user state regardless of API response
      setUser(null)
      console.log("✅ [AUTH-CONTEXT] User state cleared")
    }
  }

  // Check auth on mount and periodically
  useEffect(() => {
    console.log("🚀 [AUTH-CONTEXT] AuthProvider mounted, checking authentication...")
    checkAuth()

    // Set up periodic auth check every 5 minutes
    const interval = setInterval(
      () => {
        console.log("⏰ [AUTH-CONTEXT] Periodic auth check...")
        checkAuth()
      },
      5 * 60 * 1000,
    )

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Listen for storage events (for cross-tab logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth-logout") {
        console.log("🔄 [AUTH-CONTEXT] Cross-tab logout detected")
        setUser(null)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  }

  console.log("🔄 [AUTH-CONTEXT] Context value updated:", {
    hasUser: !!user,
    isAuthenticated,
    isLoading,
    username: user?.username,
    role: user?.role,
  })

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
