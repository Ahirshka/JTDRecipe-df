"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { exchangeCodeForToken, getGoogleUserInfo, verifyOAuthState } from "@/lib/google-auth"
import { saveUser, findUserByEmail } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")

        // Check for OAuth errors
        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        // Verify required parameters
        if (!code || !state) {
          throw new Error("Missing required OAuth parameters")
        }

        // Verify state for CSRF protection
        if (!verifyOAuthState(state)) {
          throw new Error("Invalid OAuth state - possible CSRF attack")
        }

        setMessage("Exchanging authorization code...")

        // Exchange code for access token
        const tokenResponse = await exchangeCodeForToken(code)

        setMessage("Getting user information...")

        // Get user info from Google
        const googleUser = await getGoogleUserInfo(tokenResponse.access_token)

        setMessage("Creating user account...")

        // Check if user already exists
        let user = findUserByEmail(googleUser.email)

        if (user) {
          // Update existing user with Google info
          user = {
            ...user,
            avatar: googleUser.picture,
            provider: "google",
            socialId: googleUser.id,
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVerified: googleUser.verified_email,
          }

          // Update user in storage
          const users = JSON.parse(localStorage.getItem("recipe_users") || "[]")
          const userIndex = users.findIndex((u: any) => u.id === user.id)
          if (userIndex >= 0) {
            users[userIndex] = user
            localStorage.setItem("recipe_users", JSON.stringify(users))
          }
        } else {
          // Create new user
          user = saveUser({
            username: googleUser.name,
            email: googleUser.email,
            avatar: googleUser.picture,
            provider: "google",
            socialId: googleUser.id,
            role: "user",
            status: "active",
            isVerified: googleUser.verified_email,
          })
        }

        // Log the user in
        login(user)

        setStatus("success")
        setMessage(`Welcome ${googleUser.given_name}! Redirecting to homepage...`)

        // Redirect to homepage after 2 seconds
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } catch (error) {
        console.error("Google OAuth callback error:", error)
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "An unexpected error occurred")
      }
    }

    handleGoogleCallback()
  }, [searchParams, login, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-blue-600" />}
            {status === "success" && <CheckCircle className="h-8 w-8 text-green-600" />}
            {status === "error" && <XCircle className="h-8 w-8 text-red-600" />}
          </div>
          <CardTitle>
            {status === "loading" && "Completing Google Sign-In"}
            {status === "success" && "Sign-In Successful!"}
            {status === "error" && "Sign-In Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we complete your authentication..."}
            {status === "success" && "You have been successfully signed in with Google."}
            {status === "error" && "There was a problem signing you in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">{message}</p>

          {status === "error" && (
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/login">Try Again</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          )}

          {status === "success" && <p className="text-sm text-green-600">Redirecting automatically...</p>}
        </CardContent>
      </Card>
    </div>
  )
}
