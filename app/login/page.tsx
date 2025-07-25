"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, LogIn, Crown, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect based on user role
        if (data.user.role === "owner" || data.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/")
        }
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fillOwnerCredentials = () => {
    setEmail("aaronhirshka@gmail.com")
    setPassword("Morton2121")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <LogIn className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Sign in to your recipe sharing account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Quick Access</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={fillOwnerCredentials}
              disabled={loading}
            >
              <Crown className="w-4 h-4 mr-2" />
              Fill Owner Credentials
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <Crown className="w-4 h-4 mr-2" />
              Owner Account Access
            </h3>
            <div className="text-xs text-blue-800 space-y-1">
              <p>
                <strong>Email:</strong> aaronhirshka@gmail.com
              </p>
              <p>
                <strong>Password:</strong> Morton2121
              </p>
              <p className="text-blue-600 mt-2">This account has full administrative access to the platform.</p>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              Don't have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/signup")}>
                Sign up here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
