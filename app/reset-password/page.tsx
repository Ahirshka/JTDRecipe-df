"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [isVerifyingToken, setIsVerifyingToken] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  // Password strength validation
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch = password === confirmPassword && password.length > 0

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token")
      setTokenValid(false)
      setIsVerifyingToken(false)
      return
    }

    // Verify token validity
    const verifyToken = async () => {
      try {
        const response = await fetch("/api/auth/verify-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (data.success) {
          setTokenValid(true)
        } else {
          setTokenValid(false)
          setError(data.error || "Invalid or expired reset token")
        }
      } catch (error) {
        setTokenValid(false)
        setError("Failed to verify reset token")
      } finally {
        setIsVerifyingToken(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid) {
      setError("Password does not meet requirements")
      return
    }

    if (!passwordsMatch) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("Password reset successfully! Redirecting to login...")
        setTimeout(() => {
          router.push("/login?message=Password reset successfully")
        }, 2000)
      } else {
        setError(data.error || "Failed to reset password")
      }
    } catch (error) {
      setError("Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-2">Verifying reset token...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
            <CardDescription>This password reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/forgot-password">Request New Reset Link</Link>
              </Button>
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {password && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Password Requirements:</Label>
                <div className="space-y-1 text-sm">
                  <div
                    className={`flex items-center ${passwordRequirements.length ? "text-green-600" : "text-gray-500"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 mr-2 ${passwordRequirements.length ? "text-green-600" : "text-gray-400"}`}
                    />
                    At least 8 characters
                  </div>
                  <div
                    className={`flex items-center ${passwordRequirements.uppercase ? "text-green-600" : "text-gray-500"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 mr-2 ${passwordRequirements.uppercase ? "text-green-600" : "text-gray-400"}`}
                    />
                    One uppercase letter
                  </div>
                  <div
                    className={`flex items-center ${passwordRequirements.lowercase ? "text-green-600" : "text-gray-500"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 mr-2 ${passwordRequirements.lowercase ? "text-green-600" : "text-gray-400"}`}
                    />
                    One lowercase letter
                  </div>
                  <div
                    className={`flex items-center ${passwordRequirements.number ? "text-green-600" : "text-gray-500"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 mr-2 ${passwordRequirements.number ? "text-green-600" : "text-gray-400"}`}
                    />
                    One number
                  </div>
                  <div
                    className={`flex items-center ${passwordRequirements.special ? "text-green-600" : "text-gray-500"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 mr-2 ${passwordRequirements.special ? "text-green-600" : "text-gray-400"}`}
                    />
                    One special character
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && <p className="text-sm text-red-600">Passwords do not match</p>}
              {confirmPassword && passwordsMatch && (
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !isPasswordValid || !passwordsMatch}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-orange-600 hover:text-orange-500">
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
