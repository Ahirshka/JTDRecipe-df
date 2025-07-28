"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  is_verified: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
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
    try {
      console.log("🔍 [AUTH-CONTEXT] Checking authentication status...")

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          console.log("✅ [AUTH-CONTEXT] User authenticated:", data.user.username)
          setUser(data.user)
        } else {
          console.log("❌ [AUTH-CONTEXT] No valid session found")
          setUser(null)
        }
      } else {
        console.log("❌ [AUTH-CONTEXT] Authentication check failed:", response.status)
        setUser(null)
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Error checking auth:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("🔐 [AUTH-CONTEXT] Attempting login for:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log("✅ [AUTH-CONTEXT] Login successful:", data.user.username)
        setUser(data.user)
        return { success: true }
      } else {
        console.log("❌ [AUTH-CONTEXT] Login failed:", data.error)
        return { success: false, error: data.error || "Login failed" }
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Login error:", error)
      return { success: false, error: "Network error during login" }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Logging out...")

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("✅ [AUTH-CONTEXT] Logout successful")
      setUser(null)
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Logout error:", error)
      // Still clear user state even if logout request fails
      setUser(null)
    }
  }

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
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
