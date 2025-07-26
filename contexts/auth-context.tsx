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
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    console.log("🔄 [AUTH-CONTEXT] Checking authentication status")

    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      })

      console.log("🔄 [AUTH-CONTEXT] Auth check response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("🔄 [AUTH-CONTEXT] Auth check result:", result)

        if (result.success && result.user) {
          console.log("✅ [AUTH-CONTEXT] User authenticated:", result.user.username)
          setUser(result.user)
        } else {
          console.log("❌ [AUTH-CONTEXT] No valid user in response")
          setUser(null)
        }
      } else {
        console.log("❌ [AUTH-CONTEXT] Auth check failed with status:", response.status)
        setUser(null)
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Auth check failed:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("🔄 [AUTH-CONTEXT] Attempting login for:", email)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      console.log("🔄 [AUTH-CONTEXT] Login response:", result)

      if (result.success && result.user) {
        console.log("✅ [AUTH-CONTEXT] Login successful, setting user:", result.user.username)
        setUser(result.user)
        return true
      } else {
        console.log("❌ [AUTH-CONTEXT] Login failed:", result.message)
        setUser(null)
        return false
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Login error:", error)
      setUser(null)
      return false
    }
  }

  const logout = async () => {
    console.log("🔄 [AUTH-CONTEXT] Logging out")

    try {
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

  useEffect(() => {
    checkAuth()
  }, [])

  const isAuthenticated = user !== null

  console.log("🔄 [AUTH-CONTEXT] Current state:", {
    isAuthenticated,
    user: user ? { id: user.id, username: user.username, role: user.role } : null,
    isLoading,
  })

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
