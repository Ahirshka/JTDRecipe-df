"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogIn, User, Mail, Key, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface LoginResponse {
  success: boolean
  message?: string
  error?: string
  details?: string
  data?: {
    user: {
      id: string
      username: string
      email: string
      role: string
      status: string
      is_verified: boolean
    }
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null)
  const [rawResponse, setRawResponse] = useState("")
  const router = useRouter()

  // Pre-fill owner credentials
  const fillOwnerCredentials = () => {
    setEmail("aaronhirshka@gmail.com")
    setPassword("Morton2121")
    toast({
      title: "Owner credentials filled",
      description: "Ready to login as owner",
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginResult(null)
    setRawResponse("")

    try {
      console.log("🔄 [LOGIN-PAGE] Attempting login for:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      })

      const responseText = await response.text()
      setRawResponse(responseText)

      let result: LoginResponse
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        result = {
          success: false,
          error: "JSON Parse Error",
          details: `Failed to parse response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        }
      }

      setLoginResult(result)

      if (result.success) {
        toast({
          title: "Login successful!",
          description: `Welcome back, ${result.data?.user.username || "User"}!`,
        })

        console.log("✅ [LOGIN-PAGE] Login successful, redirecting...")

        // Redirect based on role
        if (result.data?.user.role === "owner" || result.data?.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/")
        }
      } else {
        toast({
          title: "Login failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        })
        console.error("❌ [LOGIN-PAGE] Login failed:", result.error)
      }
    } catch (error) {
      console.error("❌ [LOGIN-PAGE] Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"

      const errorResult: LoginResponse = {
        success: false,
        error: "Network Error",
        details: errorMessage,
      }

      setLoginResult(errorResult)
      setRawResponse(`Network Error: ${errorMessage}`)

      toast({
        title: "Network Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <LogIn className="w-8 h-8 text-blue-600" />
          Login
        </h1>
        <p className="text-gray-600">Sign in to your recipe sharing account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
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
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Owner Account Quick Login */}
          <Card className="border-green-300">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-700 flex items-center gap-2">
                <User className="w-5 h-5" />
                Owner Account
              </CardTitle>
              <CardDescription>Quick login with owner credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">aaronhirshka@gmail.com</code>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Password:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">Morton2121</code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">owner</Badge>
                  <Badge variant="secondary">active</Badge>
                </div>
              </div>

              <Button
                onClick={fillOwnerCredentials}
                variant="outline"
                className="w-full bg-transparent"
                disabled={isLoading}
              >
                <User className="w-4 h-4 mr-2" />
                Fill Owner Credentials
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Login Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Login Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!loginResult ? (
                <div className="text-center py-8 text-gray-500">
                  <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your credentials and click "Sign In"</p>
                </div>
              ) : (
                <Tabs defaultValue="result" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="result">Result</TabsTrigger>
                    <TabsTrigger value="raw">Raw Response</TabsTrigger>
                  </TabsList>

                  <TabsContent value="result" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {loginResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${loginResult.success ? "text-green-600" : "text-red-600"}`}>
                          {loginResult.success ? "Login Successful" : "Login Failed"}
                        </span>
                      </div>

                      {loginResult.message && (
                        <Alert variant={loginResult.success ? "default" : "destructive"}>
                          <AlertDescription>{loginResult.message}</AlertDescription>
                        </Alert>
                      )}

                      {loginResult.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error:</strong> {loginResult.error}
                            {loginResult.details && (
                              <>
                                <br />
                                <strong>Details:</strong> {loginResult.details}
                              </>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {loginResult.data?.user && (
                        <Card className="border-green-300">
                          <CardHeader className="bg-green-50">
                            <CardTitle className="text-green-700 text-sm">User Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p>
                              <strong>ID:</strong> {loginResult.data.user.id}
                            </p>
                            <p>
                              <strong>Username:</strong> {loginResult.data.user.username}
                            </p>
                            <p>
                              <strong>Email:</strong> {loginResult.data.user.email}
                            </p>
                            <p>
                              <strong>Role:</strong> <Badge variant="default">{loginResult.data.user.role}</Badge>
                            </p>
                            <p>
                              <strong>Status:</strong> <Badge variant="secondary">{loginResult.data.user.status}</Badge>
                            </p>
                            <p>
                              <strong>Verified:</strong>{" "}
                              <Badge variant={loginResult.data.user.is_verified ? "default" : "destructive"}>
                                {loginResult.data.user.is_verified ? "Yes" : "No"}
                              </Badge>
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Raw API Response</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                        {rawResponse || "No response yet"}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/database-setup")} className="w-full">
                Database Setup
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/signup")} className="w-full">
                Create New Account
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/test-recipe-submission")}
                className="w-full"
              >
                Test Recipe Submission
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
