"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Lock,
  Database,
  AlertCircle,
  Bug,
  Eye,
  EyeOff,
  Play,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DebugResult {
  step1_user_lookup: {
    success: boolean
    user_found: boolean
    user_details?: {
      id: number
      username: string
      email: string
      role: string
      status: string
      is_verified: boolean
      has_password: boolean
      password_length: number
      password_starts_with: string
      created_at: string
    }
    error?: string
  }
  step2_password_verification: {
    success: boolean
    direct_bcrypt_result: boolean
    function_result: boolean
    input_password: string
    stored_hash: string
    hash_length: number
    bcrypt_rounds: string
    error?: string
  }
  step3_session_creation: {
    success: boolean
    session_created: boolean
    token_length: number
    expires: string | null
    error?: string
  }
  final_result: {
    success: boolean
    message?: string
    error?: string
    details?: string
    login_would_succeed?: boolean
  }
}

export default function DebugOwnerLoginPage() {
  const [email, setEmail] = useState("aaronhirshka@gmail.com")
  const [password, setPassword] = useState("Morton2121")
  const [showPassword, setShowPassword] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugResult, setDebugResult] = useState<{ debug: DebugResult; timestamp: string } | null>(null)
  const [rawResponse, setRawResponse] = useState("")

  const runDebug = async () => {
    setIsDebugging(true)
    setDebugResult(null)
    setRawResponse("")

    try {
      console.log("🔍 [DEBUG-UI] Starting owner login debug...")

      const response = await fetch("/api/debug/owner-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const responseText = await response.text()
      setRawResponse(responseText)

      try {
        const data = JSON.parse(responseText)
        setDebugResult(data)

        if (data.debug?.final_result?.success) {
          toast({
            title: "Debug Complete",
            description: "Owner login process would succeed!",
          })
        } else {
          toast({
            title: "Debug Complete",
            description: data.debug?.final_result?.error || "Login process would fail",
            variant: "destructive",
          })
        }
      } catch (parseError) {
        console.error("❌ [DEBUG-UI] Failed to parse response:", parseError)
        toast({
          title: "Parse Error",
          description: "Failed to parse debug response",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ [DEBUG-UI] Debug request failed:", error)
      setRawResponse(`Network Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      toast({
        title: "Network Error",
        description: "Failed to run debug process",
        variant: "destructive",
      })
    } finally {
      setIsDebugging(false)
    }
  }

  const testActualLogin = async () => {
    try {
      console.log("🔄 [DEBUG-UI] Testing actual login...")

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Login Successful!",
          description: "Owner login works correctly",
        })
        // Redirect to admin dashboard
        window.location.href = "/admin"
      } else {
        toast({
          title: "Login Failed",
          description: data.error || "Login attempt failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ [DEBUG-UI] Login test failed:", error)
      toast({
        title: "Login Test Failed",
        description: "Network error during login test",
        variant: "destructive",
      })
    }
  }

  const getStepIcon = (success: boolean | undefined) => {
    if (success === undefined) return <RefreshCw className="w-4 h-4 text-gray-400" />
    return success ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />
  }

  const getStepStatus = (success: boolean | undefined) => {
    if (success === undefined) return "pending"
    return success ? "success" : "error"
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bug className="w-8 h-8 text-red-600" />
          Debug Owner Login
        </h1>
        <p className="text-gray-600">Step-by-step debugging of the owner login process</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debug Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Debug Controls</CardTitle>
              <CardDescription>Test the owner login process step by step</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Owner email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Owner password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={runDebug} disabled={isDebugging} className="flex-1">
                  {isDebugging ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Debugging...
                    </>
                  ) : (
                    <>
                      <Bug className="w-4 h-4 mr-2" />
                      Run Debug
                    </>
                  )}
                </Button>

                <Button onClick={testActualLogin} variant="outline" className="flex-1 bg-transparent">
                  <Play className="w-4 h-4 mr-2" />
                  Test Login
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/database-setup")}
                className="w-full"
              >
                <Database className="w-4 h-4 mr-2" />
                Database Setup
              </Button>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/login")} className="w-full">
                <User className="w-4 h-4 mr-2" />
                Login Page
              </Button>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/admin")} className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Debug Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!debugResult ? (
                <div className="text-center py-8 text-gray-500">
                  <Bug className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Run Debug" to start the debugging process</p>
                </div>
              ) : (
                <Tabs defaultValue="steps" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="steps">Debug Steps</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="raw">Raw Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="steps" className="mt-4 space-y-4">
                    {/* Step 1: User Lookup */}
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getStepIcon(debugResult.debug.step1_user_lookup?.success)}
                          Step 1: User Lookup
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {debugResult.debug.step1_user_lookup?.success ? (
                          <div className="space-y-2">
                            <p className="text-sm text-green-600">✅ User found successfully</p>
                            {debugResult.debug.step1_user_lookup.user_details && (
                              <div className="bg-green-50 p-3 rounded text-xs space-y-1">
                                <p>
                                  <strong>ID:</strong> {debugResult.debug.step1_user_lookup.user_details.id}
                                </p>
                                <p>
                                  <strong>Username:</strong> {debugResult.debug.step1_user_lookup.user_details.username}
                                </p>
                                <p>
                                  <strong>Email:</strong> {debugResult.debug.step1_user_lookup.user_details.email}
                                </p>
                                <p>
                                  <strong>Role:</strong>{" "}
                                  <Badge variant="default">
                                    {debugResult.debug.step1_user_lookup.user_details.role}
                                  </Badge>
                                </p>
                                <p>
                                  <strong>Has Password:</strong>{" "}
                                  {debugResult.debug.step1_user_lookup.user_details.has_password ? "Yes" : "No"}
                                </p>
                                <p>
                                  <strong>Password Length:</strong>{" "}
                                  {debugResult.debug.step1_user_lookup.user_details.password_length}
                                </p>
                                <p>
                                  <strong>Hash Preview:</strong>{" "}
                                  {debugResult.debug.step1_user_lookup.user_details.password_starts_with}...
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-red-600">❌ User lookup failed</p>
                            {debugResult.debug.step1_user_lookup?.error && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{debugResult.debug.step1_user_lookup.error}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Step 2: Password Verification */}
                    <Card className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getStepIcon(debugResult.debug.step2_password_verification?.success)}
                          Step 2: Password Verification
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {debugResult.debug.step2_password_verification ? (
                          debugResult.debug.step2_password_verification.success ? (
                            <div className="space-y-2">
                              <p className="text-sm text-green-600">✅ Password verification successful</p>
                              <div className="bg-green-50 p-3 rounded text-xs space-y-1">
                                <p>
                                  <strong>Direct bcrypt test:</strong>{" "}
                                  {debugResult.debug.step2_password_verification.direct_bcrypt_result ? "PASS" : "FAIL"}
                                </p>
                                <p>
                                  <strong>Function test:</strong>{" "}
                                  {debugResult.debug.step2_password_verification.function_result ? "PASS" : "FAIL"}
                                </p>
                                <p>
                                  <strong>Input password:</strong>{" "}
                                  {debugResult.debug.step2_password_verification.input_password}
                                </p>
                                <p>
                                  <strong>Hash format:</strong>{" "}
                                  {debugResult.debug.step2_password_verification.bcrypt_rounds}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-red-600">❌ Password verification failed</p>
                              <div className="bg-red-50 p-3 rounded text-xs space-y-1">
                                <p>
                                  <strong>Direct bcrypt test:</strong>{" "}
                                  {debugResult.debug.step2_password_verification.direct_bcrypt_result ? "PASS" : "FAIL"}
                                </p>
                                <p>
                                  <strong>Function test:</strong>{" "}
                                  {debugResult.debug.step2_password_verification.function_result ? "PASS" : "FAIL"}
                                </p>
                                <p>
                                  <strong>Input password:</strong> "
                                  {debugResult.debug.step2_password_verification.input_password}"
                                </p>
                                <p>
                                  <strong>Stored hash:</strong>{" "}
                                  {debugResult.debug.step2_password_verification.stored_hash}
                                </p>
                                <p>
                                  <strong>Hash length:</strong>{" "}
                                  {debugResult.debug.step2_password_verification.hash_length}
                                </p>
                              </div>
                              {debugResult.debug.step2_password_verification.error && (
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    {debugResult.debug.step2_password_verification.error}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          )
                        ) : (
                          <p className="text-sm text-gray-500">⏳ Waiting for step 1 to complete...</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Step 3: Session Creation */}
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getStepIcon(debugResult.debug.step3_session_creation?.success)}
                          Step 3: Session Creation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {debugResult.debug.step3_session_creation ? (
                          debugResult.debug.step3_session_creation.success ? (
                            <div className="space-y-2">
                              <p className="text-sm text-green-600">✅ Session created successfully</p>
                              <div className="bg-green-50 p-3 rounded text-xs space-y-1">
                                <p>
                                  <strong>Token length:</strong> {debugResult.debug.step3_session_creation.token_length}
                                </p>
                                <p>
                                  <strong>Expires:</strong> {debugResult.debug.step3_session_creation.expires}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-red-600">❌ Session creation failed</p>
                              {debugResult.debug.step3_session_creation.error && (
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>{debugResult.debug.step3_session_creation.error}</AlertDescription>
                                </Alert>
                              )}
                            </div>
                          )
                        ) : (
                          <p className="text-sm text-gray-500">⏳ Waiting for previous steps to complete...</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="summary" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {debugResult.debug.final_result?.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          Final Result
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {debugResult.debug.final_result?.success ? (
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Success!</strong> {debugResult.debug.final_result.message}
                              <br />
                              The owner login process would succeed with these credentials.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Failed:</strong> {debugResult.debug.final_result?.error}
                              <br />
                              {debugResult.debug.final_result?.details}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="mt-4 text-xs text-gray-500">
                          Debug completed at: {new Date(debugResult.timestamp).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Raw Debug Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                          {rawResponse || "No raw data available"}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
