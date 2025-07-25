"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, CheckCircle, AlertCircle, RefreshCw, User, Key, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface InitResponse {
  success: boolean
  message?: string
  error?: string
  details?: string
  data?: {
    owner?: {
      id: string
      username: string
      email: string
      role: string
    }
  }
}

export default function DatabaseSetup() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [initResult, setInitResult] = useState<InitResponse | null>(null)
  const [rawResponse, setRawResponse] = useState("")

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setInitResult(null)
    setRawResponse("")

    try {
      console.log("🔄 [DB-SETUP] Initializing database...")

      const response = await fetch("/api/init-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const responseText = await response.text()
      setRawResponse(responseText)

      let result: InitResponse
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        result = {
          success: false,
          error: "JSON Parse Error",
          details: `Failed to parse response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        }
      }

      setInitResult(result)

      if (result.success) {
        toast({
          title: "Success!",
          description: result.message || "Database initialized successfully",
        })
        console.log("✅ [DB-SETUP] Database initialization successful")
      } else {
        toast({
          title: "Initialization Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
        console.error("❌ [DB-SETUP] Database initialization failed:", result.error)
      }
    } catch (error) {
      console.error("❌ [DB-SETUP] Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"

      const errorResult: InitResponse = {
        success: false,
        error: "Network Error",
        details: errorMessage,
      }

      setInitResult(errorResult)
      setRawResponse(`Network Error: ${errorMessage}`)

      toast({
        title: "Network Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8 text-blue-600" />
          Database Setup
        </h1>
        <p className="text-gray-600">Initialize the database with JSONB schema and create the owner account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setup Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Initialization</CardTitle>
              <CardDescription>Create tables with JSONB arrays and owner account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">What will be created:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    <strong>users</strong> table with authentication fields
                  </li>
                  <li>
                    <strong>user_sessions</strong> table for session management
                  </li>
                  <li>
                    <strong>recipes</strong> table with <Badge variant="secondary">JSONB arrays</Badge>
                  </li>
                  <li>
                    <strong>moderation_log</strong> table for admin actions
                  </li>
                  <li>Owner account with admin privileges</li>
                </ul>
              </div>

              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>JSONB Schema:</strong>
                  <br />
                  <code className="text-xs">
                    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb
                    <br />
                    instructions JSONB NOT NULL DEFAULT '[]'::jsonb
                    <br />
                    tags JSONB DEFAULT '[]'::jsonb
                  </code>
                </AlertDescription>
              </Alert>

              <Button onClick={initializeDatabase} disabled={isInitializing} className="w-full" size="lg">
                {isInitializing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Initializing Database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Initialize Database & Create Owner
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Owner Account Info */}
          <Card className="border-green-300">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-700 flex items-center gap-2">
                <User className="w-5 h-5" />
                Owner Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">aaronhirshka@gmail.com</code>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Username:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">aaronhirshka</code>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Password:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">Morton2121</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">admin</Badge>
                <Badge variant="secondary">active</Badge>
                <Badge variant="outline">verified</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Initialization Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!initResult ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Initialize Database" to begin setup</p>
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
                        {initResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${initResult.success ? "text-green-600" : "text-red-600"}`}>
                          {initResult.success ? "Success" : "Failed"}
                        </span>
                      </div>

                      {initResult.message && (
                        <Alert variant={initResult.success ? "default" : "destructive"}>
                          <AlertDescription>{initResult.message}</AlertDescription>
                        </Alert>
                      )}

                      {initResult.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error:</strong> {initResult.error}
                            {initResult.details && (
                              <>
                                <br />
                                <strong>Details:</strong> {initResult.details}
                              </>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {initResult.data?.owner && (
                        <Card className="border-green-300">
                          <CardHeader className="bg-green-50">
                            <CardTitle className="text-green-700 text-sm">Owner Account Created</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p>
                              <strong>ID:</strong> {initResult.data.owner.id}
                            </p>
                            <p>
                              <strong>Username:</strong> {initResult.data.owner.username}
                            </p>
                            <p>
                              <strong>Email:</strong> {initResult.data.owner.email}
                            </p>
                            <p>
                              <strong>Role:</strong> <Badge variant="default">{initResult.data.owner.role}</Badge>
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

          {/* Next Steps */}
          {initResult?.success && (
            <Card className="border-blue-300">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-700">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/login")}
                    className="w-full"
                  >
                    Go to Login Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/test-recipe-submission")}
                    className="w-full"
                  >
                    Test Recipe Submission
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/admin")}
                    className="w-full"
                  >
                    Open Admin Panel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* JSONB Format Info */}
          <Card className="border-purple-300">
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-purple-700">JSONB Array Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Frontend sends:</strong>
                </p>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  {`{
  "ingredients": ["2 cups flour", "1 cup sugar", "3 eggs"],
  "instructions": ["Mix ingredients", "Bake for 30 min"],
  "tags": ["dessert", "easy"]
}`}
                </code>
                <p>
                  <strong>Database stores as:</strong>
                </p>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb
                  <br />
                  instructions JSONB NOT NULL DEFAULT '[]'::jsonb
                  <br />
                  tags JSONB DEFAULT '[]'::jsonb
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
