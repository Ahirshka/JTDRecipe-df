"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export default function TestRegistrationPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; user?: any } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: "Registration successful!",
          user: data.user,
        })
        // Reset form
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          agreeToTerms: false,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Registration failed",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Network error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Test User Registration</CardTitle>
            <CardDescription>
              This page is for testing the user registration functionality. Fill out the form below to test account
              creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertDescription>
                  {result.message}
                  {result.success && result.user && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                      <strong>User Created:</strong>
                      <br />
                      ID: {result.user.id}
                      <br />
                      Username: {result.user.username}
                      <br />
                      Email: {result.user.email}
                      <br />
                      Role: {result.user.role}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="Enter username (3-30 characters)"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Enter password (min 8 characters)"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the Terms and Conditions and Privacy Policy
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Test Registration"}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Test Cases to Try:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Valid registration with all fields filled</li>
                <li>❌ Try registering with the same email twice</li>
                <li>❌ Try passwords that don't match</li>
                <li>❌ Try password shorter than 8 characters</li>
                <li>❌ Try without agreeing to terms</li>
                <li>❌ Try with invalid email format</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
