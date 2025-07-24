"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChefHat, ArrowRight, Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      setIsLoading(false)
      return
    }

    console.log("Submitting login form for:", formData.email)

    const result = await login(formData.email, formData.password)

    if (result.success) {
      console.log("Login successful, redirecting to home")
      router.push("/")
    } else {
      console.log("Login failed:", result.error)
      setError(result.error || "Login failed")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Welcome Back Section */}
        <div className="space-y-6 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <h1 className="text-4xl font-bold text-gray-900">Welcome Back, Chef! 👨‍🍳</h1>
            </div>
            <p className="text-xl text-gray-600">Continue your culinary journey and discover new flavors</p>
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Ready to cook something amazing?</h3>
            <p className="text-gray-600 mb-4">
              Access your saved recipes, continue where you left off, and explore new culinary adventures.
            </p>
            <div className="flex items-center space-x-2 text-sm text-orange-600">
              <Lock className="h-4 w-4" />
              <span>Your account is secure and your recipes are waiting</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-orange-500 hover:text-orange-600">
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Signing In..."
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-gray-600">
              New to our community?{" "}
              <Link href="/signup" className="text-orange-500 hover:text-orange-600 font-medium">
                Join us today!
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
