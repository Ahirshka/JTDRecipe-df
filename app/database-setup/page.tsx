"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, AlertCircle, RefreshCw, User, Key, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface InitResponse {
  success: boolean
  message: string
  details?: string
  owner?: {
    email: string
    username: string
    role: string
    id?: string
  }
}

export default function DatabaseSetup() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [initResult, setInitResult] = useState<InitResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setError(null)
    setInitResult(null)

    try {
      console.log("🔄 [DB-SETUP] Starting database initialization...")

      const response = await fetch("/api/init-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const responseText = await response.text()
      console.log("📥 [DB-SETUP] Raw response:", responseText)

      let data: InitResponse
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("❌ [DB-SETUP] JSON parse error:", parseError)
        throw new Error(`Failed to parse response: ${responseText}`)
      }

      console.log("✅ [DB-SETUP] Parsed response:", data)

      if (data.success) {
        setInitResult(data)
        toast({
          title: "Success!",
          description: data.message,
        })
        console.log("✅ [DB-SETUP] Database initialization successful")
      } else {
        setError(data.details || data.message || "Unknown error occurred")
        toast({
          title: "Initialization Failed",
          description: data.details || data.message || "Unknown error occurred",
          variant: "destructive",
        })
        console.error("❌ [DB-SETUP] Database initialization failed:", data)
      }
    } catch (error) {
      console.error("❌ [DB-SETUP] Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"
      setError(errorMessage)

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
        <p className="text-gray-600">Initialize the database with proper JSONB schema and create the owner account</p>
      </div>

      <div className="space-y-6">
        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Follow these steps to set up your recipe sharing platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Initialize Database</h4>
                  <p className="text-sm text-gray-600">
                    Create all necessary tables with proper JSONB schema for recipe arrays
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Create Owner Account</h4>
                  <p className="text-sm text-gray-600">Set up the admin account with the specified credentials</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Test Authentication</h4>
                  <p className="text-sm text-gray-600">Log in with the owner credentials and test recipe submission</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Schema Info */}
        <Card>
          <CardHeader>
            <CardTitle>Database Schema (JSONB Arrays)</CardTitle>
            <CardDescription>The database will be created with proper JSONB array support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Tables to be created:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    <strong>users</strong> - User accounts with authentication
                  </li>
                  <li>
                    <strong>user_sessions</strong> - Session management
                  </li>
                  <li>
                    <strong>recipes</strong> - Recipe data with JSONB arrays
                  </li>
                  <li>
                    <strong>moderation_log</strong> - Admin moderation tracking
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recipe JSONB Schema:</h4>
                <code className="block bg-gray-100 p-3 rounded text-sm">
                  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb
                  <br />
                  instructions JSONB NOT NULL DEFAULT '[]'::jsonb
                  <br />
                  tags JSONB DEFAULT '[]'::jsonb
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Owner Account Details</CardTitle>
            <CardDescription>The following admin account will be created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Role:</span>
                <Badge variant="outline">admin</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Initialize Button */}
        <Card>
          <CardHeader>
            <CardTitle>Initialize Database</CardTitle>
            <CardDescription>
              {initResult
                ? "Database has been initialized successfully"
                : "Click the button below to set up your database"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={initializeDatabase} disabled={isInitializing} size="lg" className="w-full">
              {isInitializing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Initializing Database...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Initialize Database & Create Owner Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {initResult && (
          <Card className="border-green-300">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-700 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Initialization Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-green-700">{initResult.message}</p>
                {initResult.details && <p className="text-sm text-gray-600">{initResult.details}</p>}
                {initResult.owner && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Owner Account Created:</h4>
                    <div className="bg-white p-3 rounded border space-y-1">
                      <p className="text-sm">
                        <strong>Email:</strong> {initResult.owner.email}
                      </p>
                      <p className="text-sm">
                        <strong>Username:</strong> {initResult.owner.username}
                      </p>
                      <p className="text-sm">
                        <strong>Role:</strong> {initResult.owner.role}
                      </p>
                      {initResult.owner.id && (
                        <p className="text-sm">
                          <strong>ID:</strong> {initResult.owner.id}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => (window.location.href = "/login")} size="sm">
                    Go to Login
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/test-recipe-submission")}
                    variant="outline"
                    size="sm"
                  >
                    Test Recipe Submission
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-300">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Initialization Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Troubleshooting Steps:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Check that your DATABASE_URL environment variable is set correctly</li>
                  <li>Ensure your database is accessible and running</li>
                  <li>Verify that the database user has CREATE TABLE permissions</li>
                  <li>Check the server logs for more detailed error information</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Required environment variables for the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">DATABASE_URL:</span>
                <Badge variant={process.env.DATABASE_URL ? "default" : "destructive"}>
                  {process.env.DATABASE_URL ? "Set" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">JWT_SECRET:</span>
                <Badge variant={process.env.JWT_SECRET ? "default" : "destructive"}>
                  {process.env.JWT_SECRET ? "Set" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">NEXT_PUBLIC_APP_URL:</span>
                <Badge variant={process.env.NEXT_PUBLIC_APP_URL ? "default" : "secondary"}>
                  {process.env.NEXT_PUBLIC_APP_URL ? "Set" : "Optional"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
