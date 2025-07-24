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
import { Sparkles, Users, BookOpen, Heart, ArrowRight } from "lucide-react"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push("/")
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Welcome Section */}
        <div className="space-y-6 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Sparkles className="h-8 w-8 text-orange-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Join the Recipe Revolution!
              </h1>
            </div>
            <p className="text-xl text-gray-600">
              Discover, share, and create amazing recipes with food lovers from around the world 🍳
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Join Our Community</h3>
                <p className="text-gray-600">Connect with passionate home cooks and professional chefs</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Share Your Recipes</h3>
                <p className="text-gray-600">Upload your favorite recipes and inspire others</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Save Favorites</h3>
                <p className="text-gray-600">Build your personal cookbook with recipes you love</p>
              </div>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <Card className="w-full max-w-md mx-auto shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
            <CardDescription>Start your culinary journey today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Your chef name"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="chef@example.com"
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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Creating Account..."
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Join the Community</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                Welcome back!
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
