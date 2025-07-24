"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { secureDB, type SecureUser, type LoginSession } from "@/lib/secure-database"

interface SecureAuthContextType {
  user: SecureUser | null
  session: LoginSession | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  refreshUser: () => Promise<void>
}

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined)

export function SecureAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SecureUser | null>(null)
  const [session, setSession] = useState<LoginSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (token) {
        const validUser = await secureDB.validateSession(token)
        if (validUser) {
          setUser(validUser)
          // Note: We don't store the full session object in state for security
        } else {
          localStorage.removeItem("auth_token")
        }
      }
    } catch (error) {
      console.error("Session validation error:", error)
      localStorage.removeItem("auth_token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await secureDB.authenticateUser(
        email,
        password,
        // In a real app, you'd get these from the request
        "127.0.0.1",
        navigator.userAgent,
      )

      if (result) {
        setUser(result.user)
        setSession(result.session)
        localStorage.setItem("auth_token", result.session.token)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (token) {
        await secureDB.revokeSession(token)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setSession(null)
      localStorage.removeItem("auth_token")
    }
  }

  const refreshUser = async () => {
    if (user) {
      const updatedUser = secureDB.getUserById(user.id)
      if (updatedUser) {
        setUser(updatedUser)
      }
    }
  }

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    refreshUser,
  }

  return <SecureAuthContext.Provider value={value}>{children}</SecureAuthContext.Provider>
}

export function useSecureAuth() {
  const context = useContext(SecureAuthContext)
  if (context === undefined) {
    throw new Error("useSecureAuth must be used within a SecureAuthProvider")
  }
  return context
}
