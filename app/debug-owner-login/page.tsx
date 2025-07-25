"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, RefreshCw, AlertCircle, Bug, TestTube } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DebugStep {
  step: number
  name: string
  status: "pending" | "success" | "error"
  message: string
  data?: any
  error?: string
}

interface DebugResult {
  success: boolean
  steps: DebugStep[]
  summary: string
  loginWorking: boolean
}

export default function DebugOwnerLoginPage() {
  const [credentials, setCredentials] = useState({
    email: "admin@recipesite.com",
    password: "admin123",
  })

  const [isDebugging, setIsDebugging] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [loginResult, setLoginResult] = useState<any>(null)
  const [rawDebugResponse, setRawDebugResponse] = useState("")
  const [rawLoginResponse, setRawLoginResponse] = useState("")

  const runDebugProcess = async () => {
    setIsDebugging(true)
    setDebugResult(null)
    setRawDebugResponse("")

    try {
      console.log("🐛 [DEBUG] Starting owner login debug process...")

      const response = await fetch("/api/debug/owner-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const responseText = await response.text()
      setRawDebugResponse(responseText)

      let result: DebugResult
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        result = {
          success: false,
          steps: [
            {
              step: 0,
              name: "Parse Response",
              status: "error",
              message: "Failed to parse debug response",
              error: parseError instanceof Error ? parseError.message : "Unknown parse error",
            },
          ],
          summary: "Debug process failed due to response parsing error",
          loginWorking: false,
        }
      }

      setDebugResult(result)

      if (result.success && result.loginWorking) {
        toast({
          title: "Debug Complete - Login Working!",
          description: "Owner login process is functioning correctly",
        })
      } else {
        toast({
          title: "Debug Complete - Issues Found",
          description: "Owner login has issues that need to be resolved",
          variant: "destructive",
        })
      }

      console.log("🐛 [DEBUG] Debug process complete:", result)
    } catch (error) {
      console.error("❌ [DEBUG] Debug process error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"

      const errorResult: DebugResult = {
        success: false,
        steps: [
          {
            step: 0,
            name: "Network Request",
            status: "error",
            message: "Failed to connect to debug API",
            error: errorMessage,
          },
        ],
        summary: "Debug process failed due to network error",
        loginWorking: false,
      }

      setDebugResult(errorResult)
      setRawDebugResponse(`Network Error: ${errorMessage}`)

      toast({
        title: "Debug Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDebugging(false)
    }
  }

  const testActualLogin = async () => {
    setIsTesting(true)
    setLoginResult(null)
    setRawLoginResponse("")

    try {
      console.log("🧪 [TEST] Testing actual login...")

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const responseText = await response.text()
      setRawLoginResponse(responseText)

      let result: any
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        result = {
          success: false,
          error: "JSON Parse Error",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        }
      }

      setLoginResult(result)

      if (result.success) {
        toast({
          title: "Login Test Successful!",
          description: `Logged in as ${result.user?.username || "unknown user"}`,
        })
      } else {
        toast({
          title: "Login Test Failed",
          description: result.error || "Login failed for unknown reason",
          variant: "destructive",
        })
      }

      console.log("🧪 [TEST] Login test complete:", result)
    } catch (error) {
      console.error("❌ [TEST] Login test error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"

      const errorResult = {
        success: false,
        error: "Network Error",
        details: errorMessage,
      }

      setLoginResult(errorResult)
      setRawLoginResponse(`Network Error: ${errorMessage}`)

      toast({
        title: "Login Test Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <RefreshCw className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bug className="w-8 h-8 text-red-600" />
          Owner Login Debug
        </h1>
        <p className="text-gray-600">Debug and test the owner login process step by step</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debug Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Debug Configuration</CardTitle>
              <CardDescription>Configure credentials to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="debug-email">Email</Label>
                <Input
                  id="debug-email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="debug-password">Password</Label>
                <Input
                  id="debug-password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug Actions</CardTitle>
              <CardDescription>Run debugging and testing processes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runDebugProcess} disabled={isDebugging} className="w-full" variant="default">
                {isDebugging ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Debug...
                  </>
                ) : (
                  <>
                    <Bug className="w-4 h-4 mr-2" />
                    Run Debug Process
                  </>
                )}
              </Button>

              <Button
                onClick={testActualLogin}
                disabled={isTesting}
                className="w-full bg-transparent"
                variant="outline"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing Login...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Actual Login
                  </>
                )}
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Debug Process</strong> tests each step of login without actually logging in.
                  <br />
                  <strong>Test Login</strong> attempts actual login with the API.
                </AlertDescription>
              </Alert>
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
                  <p>Click "Run Debug Process" to start debugging</p>
                </div>
              ) : (
                <Tabs defaultValue="steps" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="steps">Debug Steps</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="raw">Raw Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="steps" className="mt-4">
                    <div className="space-y-3">
                      {debugResult.steps.map((step) => (
                        <Card
                          key={step.step}
                          className={`border-l-4 ${
                            step.status === "success"
                              ? "border-l-green-500"
                              : step.status === "error"
                                ? "border-l-red-500"
                                : "border-l-gray-300"
                          }`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              {getStepIcon(step.status)}
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  Step {step.step}: {step.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                                {step.error && (
                                  <Alert variant="destructive" className="mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{step.error}</AlertDescription>
                                  </Alert>
                                )}
                                {step.data && (
                                  <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-auto">
                                    {JSON.stringify(step.data, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="summary" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {debugResult.loginWorking ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${debugResult.loginWorking ? "text-green-600" : "text-red-600"}`}>
                          {debugResult.loginWorking ? "Login Process Working" : "Login Process Has Issues"}
                        </span>
                      </div>
                      <Alert variant={debugResult.loginWorking ? "default" : "destructive"}>
                        <AlertDescription>{debugResult.summary}</AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Raw Debug Response</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                        {rawDebugResponse || "No debug response yet"}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Login Test Results */}
          {loginResult && (
            <Card>
              <CardHeader>
                <CardTitle>Login Test Results</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${loginResult.success ? "text-green-600" : "text-red-600"}`}>
                          {loginResult.success ? "Login Successful" : "Login Failed"}
                        </span>
                      </div>

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

                      {loginResult.user && (
                        <Card className="border-green-300">
                          <CardHeader className="bg-green-50">
                            <CardTitle className="text-green-700 text-sm">Logged In User</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p>
                              <strong>ID:</strong> {loginResult.user.id}
                            </p>
                            <p>
                              <strong>Username:</strong> {loginResult.user.username}
                            </p>
                            <p>
                              <strong>Email:</strong> {loginResult.user.email}
                            </p>
                            <p>
                              <strong>Role:</strong> <Badge variant="default">{loginResult.user.role}</Badge>
                            </p>
                            <p>
                              <strong>Status:</strong> <Badge variant="secondary">{loginResult.user.status}</Badge>
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Raw Login Response</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                        {rawLoginResponse || "No login response yet"}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
