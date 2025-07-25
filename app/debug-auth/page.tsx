"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bug, RefreshCw, CheckCircle, AlertCircle, Database, Key, User, LogIn, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DebugTest {
  name: string
  status: string
  details?: any
  error?: string
}

interface DebugResult {
  success: boolean
  debug: {
    timestamp: string
    tests: DebugTest[]
  }
  error?: string
  details?: string
}

export default function DebugAuthPage() {
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDebugTests = async () => {
    setIsLoading(true)
    setDebugResult(null)

    try {
      console.log("🔍 [DEBUG-AUTH] Running authentication debug tests...")

      const response = await fetch("/api/debug/auth")
      const result: DebugResult = await response.json()
      setDebugResult(result)

      if (result.success) {
        const passedTests = result.debug.tests.filter((test) => test.status.includes("PASS")).length
        const totalTests = result.debug.tests.length

        toast({
          title: "Debug Tests Completed",
          description: `${passedTests}/${totalTests} tests passed`,
          variant: passedTests === totalTests ? "default" : "destructive",
        })
        console.log("✅ [DEBUG-AUTH] Debug tests completed")
      } else {
        toast({
          title: "Debug Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        })
        console.error("❌ [DEBUG-AUTH] Debug failed:", result.error)
      }
    } catch (error) {
      console.error("❌ [DEBUG-AUTH] Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"

      setDebugResult({
        success: false,
        error: "Network Error",
        details: errorMessage,
        debug: {
          timestamp: new Date().toISOString(),
          tests: [],
        },
      })

      toast({
        title: "Network Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTestIcon = (status: string) => {
    if (status.includes("PASS")) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (status.includes("FAIL")) return <AlertCircle className="w-4 h-4 text-red-600" />
    if (status.includes("NO USER")) return <User className="w-4 h-4 text-yellow-600" />
    return <AlertCircle className="w-4 h-4 text-gray-600" />
  }

  const getTestColor = (status: string) => {
    if (status.includes("PASS")) return "text-green-600"
    if (status.includes("FAIL")) return "text-red-600"
    if (status.includes("NO USER")) return "text-yellow-600"
    return "text-gray-600"
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bug className="w-8 h-8 text-blue-600" />
          Debug Authentication
        </h1>
        <p className="text-gray-600">Test and debug the authentication system step by step</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debug Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Authentication Debug Tests
              </CardTitle>
              <CardDescription>Run comprehensive tests to identify authentication issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Tests Include:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Database className="w-3 h-3" />
                    Database Connection Test
                  </li>
                  <li className="flex items-center gap-2">
                    <Key className="w-3 h-3" />
                    Password Hashing Test
                  </li>
                  <li className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    User Lookup Test
                  </li>
                  <li className="flex items-center gap-2">
                    <LogIn className="w-3 h-3" />
                    Full Login Process Test
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Users Table Status
                  </li>
                </ul>
              </div>

              <Button onClick={runDebugTests} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Bug className="w-4 h-4 mr-2" />
                    Run Debug Tests
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Credentials */}
          <Card className="border-green-300">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-700 flex items-center gap-2">
                <User className="w-5 h-5" />
                Test Credentials
              </CardTitle>
              <CardDescription>These credentials are used for testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Email:</strong>{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">aaronhirshka@gmail.com</code>
              </p>
              <p>
                <strong>Password:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-sm">Morton2121</code>
              </p>
              <p>
                <strong>Expected Role:</strong> <Badge variant="default">admin</Badge>
              </p>
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
                  <p>Click "Run Debug Tests" to start testing</p>
                </div>
              ) : (
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {debugResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${debugResult.success ? "text-green-600" : "text-red-600"}`}>
                          {debugResult.success ? "Debug Completed" : "Debug Failed"}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600">
                        <strong>Timestamp:</strong> {new Date(debugResult.debug.timestamp).toLocaleString()}
                      </div>

                      {debugResult.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error:</strong> {debugResult.error}
                            {debugResult.details && (
                              <>
                                <br />
                                <strong>Details:</strong> {debugResult.details}
                              </>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <h4 className="font-medium">Test Results:</h4>
                        {debugResult.debug.tests.map((test, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getTestIcon(test.status)}
                              <span className="font-medium">{test.name}</span>
                            </div>
                            <Badge
                              variant={
                                test.status.includes("PASS")
                                  ? "default"
                                  : test.status.includes("NO USER")
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {test.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-4">
                    <div className="space-y-4">
                      {debugResult.debug.tests.map((test, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <CardTitle className={`text-sm flex items-center gap-2 ${getTestColor(test.status)}`}>
                              {getTestIcon(test.status)}
                              {test.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {test.error ? (
                              <Alert variant="destructive">
                                <AlertDescription>
                                  <strong>Error:</strong> {test.error}
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <div className="space-y-2">
                                {typeof test.details === "string" ? (
                                  <p className="text-sm">{test.details}</p>
                                ) : (
                                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                    {JSON.stringify(test.details, null, 2)}
                                  </pre>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/database-setup")}
                className="w-full"
              >
                Database Setup
              </Button>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/login")} className="w-full">
                Go to Login
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={runDebugTests}
                disabled={isLoading}
                className="w-full bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-run Tests
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
