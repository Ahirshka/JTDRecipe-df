"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
  is_verified: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuthStatus = async () => {
    try {
      console.log("Checking auth status...")
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          console.log("User authenticated:", data.user)
          setUser(data.user)
        } else {
          console.log("User not authenticated")
          setUser(null)
        }
      } else {
        console.log("Auth check failed with status:", response.status)
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check error:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.user) {
        console.log("Login successful, setting user:", data.user)
        setUser(data.user)
        return { success: true }
      } else {
        console.log("Login failed:", data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Network error" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      console.log("User logged out")
    } catch (error) {
      console.error("Logout error:", error)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    await checkAuthStatus()
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
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
