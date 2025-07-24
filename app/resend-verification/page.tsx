"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react"

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setError("Email address is required")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setSent(true)
      } else {
        setError(data.error || "Failed to resend verification email")
      }
    } catch (error) {
      console.error("Resend verification error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Verification Email Sent</CardTitle>
              <CardDescription className="text-gray-600">
                We've sent a new verification email to {email}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <Mail className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Check your email and click the verification link to activate your account.
                </AlertDescription>
              </Alert>

              <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                <Link href="/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Mail className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Resend Verification Email</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your email address to receive a new verification link
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    required
                    placeholder="Enter your email address"
                    className="pl-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
