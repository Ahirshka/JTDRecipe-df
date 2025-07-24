import { type NextRequest, NextResponse } from "next/server"
import { findUserById } from "@/lib/neon"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: string }
      const user = await findUserById(decoded.userId)

      if (!user) {
        return NextResponse.json({ authenticated: false, user: null })
      }

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user

      return NextResponse.json({
        authenticated: true,
        user: userWithoutPassword,
      })
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({ authenticated: false, user: null })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ authenticated: false, user: null })
  }
}
