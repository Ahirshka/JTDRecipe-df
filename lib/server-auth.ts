import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { findUserById } from "./neon"
import { verifyToken } from "./auth"
import type { User } from "./neon"

export async function getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get("authorization")
    let token: string | null = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      // Try to get token from cookies
      const cookieStore = cookies()
      token = cookieStore.get("auth-token")?.value || null
    }

    if (!token) {
      return null
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      return null
    }

    // Get user from database
    const user = await findUserById(payload.userId)
    if (!user) {
      return null
    }

    // Check if user is active
    if (user.status !== "active") {
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user from request:", error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      return null
    }

    // Get user from database
    const user = await findUserById(payload.userId)
    if (!user) {
      return null
    }

    // Check if user is active
    if (user.status !== "active") {
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete("auth-token")
}

export async function requireAdmin(request: NextRequest): Promise<User | null> {
  const user = await getCurrentUserFromRequest(request)
  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return null
  }
  return user
}

export async function isAdmin(user: User | null): Promise<boolean> {
  return user?.role === "admin" || user?.role === "owner"
}

export async function requireAuth(request: NextRequest): Promise<User | null> {
  return getCurrentUserFromRequest(request)
}

export function hasRole(user: User | null, role: string): boolean {
  return user?.role === role
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  return user ? roles.includes(user.role) : false
}
