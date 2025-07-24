import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { findUserById, type User } from "@/lib/neon"

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: number }
    const user = await findUserById(payload.userId)

    return user
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== "admin" && user.role !== "owner") {
    throw new Error("Admin access required")
  }
  return user
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete("auth-token")
}
