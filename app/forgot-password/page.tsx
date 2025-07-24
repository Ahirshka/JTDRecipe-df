"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Email is required")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(data.message)
        setEmailSent(true)
      } else {
        setError(data.error || "Failed to send password reset email")
      }
    } catch (error) {
      setError("Failed to send password reset email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>We've sent password reset instructions to your email address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-gray-900">What to do next:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Check your email inbox for the reset link</li>
                  <li>Click the link in the email to reset your password</li>
                  <li>The link will expire in 1 hour for security</li>
                  <li>Check your spam folder if you don't see the email</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                  setMessage("")
                  setError("")
                }}
                variant="outline"
                className="w-full"
              >
                Send Another Reset Email
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
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
            <Mail className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-orange-600 hover:text-orange-500 inline-flex items-center">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Login
              </Link>
            </div>
          </form>

          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>
              Remember your password?{" "}
              <Link href="/login" className="text-orange-600 hover:text-orange-500">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
