"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, AlertCircle, RefreshCw, LogIn, Copy } from "lucide-react"
import { useRouter } from "next/navigation"

interface InitResponse {
  success: boolean
  message: string
  ownerExists?: boolean
  ownerCreated?: boolean
  credentials?: {
    email: string
    password: string
  }
  owner?: {
    id: string
    username: string
    email: string
    role: string
  }
  error?: string
  details?: string
}

export default function DatabaseSetup() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [initResult, setInitResult] = useState<InitResponse | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setInitResult(null)

    try {
      console.log("🔄 [DB-SETUP] Initializing database...")

      const response = await fetch("/api/init-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("📥 [DB-SETUP] Response:", data)

      setInitResult(data)

      if (data.success) {
        console.log("✅ [DB-SETUP] Database initialization successful")
      } else {
        console.error("❌ [DB-SETUP] Database initialization failed:", data.error)
      }
    } catch (error) {
      console.error("❌ [DB-SETUP] Network error:", error)
      setInitResult({
        success: false,
        message: "Network error occurred",
        error: "Network Error",
        details: error instanceof Error ? error.message : "Unknown network error",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const goToLogin = () => {
    router.push("/login")
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8 text-blue-600" />
          Database Setup
        </h1>
        <p className="text-gray-600">Initialize the database and create the owner account</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Initialization</CardTitle>
          <CardDescription>
            This will create all necessary database tables and set up the initial owner account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">What this will do:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>Create users table with proper schema</li>
              <li>Create user_sessions table for authentication</li>
              <li>Create recipes table for recipe storage</li>
              <li>Create moderation_log table for admin actions</li>
              <li>Set up owner account with admin privileges</li>
            </ul>
          </div>

          <Button onClick={initializeDatabase} disabled={isInitializing} className="w-full" size="lg">
            {isInitializing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Initializing Database...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Initialize Database
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {initResult && (
        <Card className={`mb-6 ${initResult.success ? "border-green-300" : "border-red-300"}`}>
          <CardHeader className={initResult.success ? "bg-green-50" : "bg-red-50"}>
            <CardTitle className={`flex items-center gap-2 ${initResult.success ? "text-green-700" : "text-red-700"}`}>
              {initResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {initResult.success ? "Success!" : "Error"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={initResult.success ? "text-green-700" : "text-red-700"}>{initResult.message}</p>

            {initResult.success && initResult.credentials && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {initResult.ownerExists && <Badge variant="secondary">Owner Exists</Badge>}
                  {initResult.ownerCreated && <Badge variant="default">Owner Created</Badge>}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">Owner Account Credentials:</h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Email:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded text-sm">{initResult.credentials.email}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(initResult.credentials!.email, "email")}
                        >
                          {copied === "email" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Password:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded text-sm">{initResult.credentials.password}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(initResult.credentials!.password, "password")}
                        >
                          {copied === "password" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Save these credentials! You'll need them to log in as the owner.
                    </AlertDescription>
                  </Alert>
                </div>

                <Button onClick={goToLogin} className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Go to Login Page
                </Button>
              </div>
            )}

            {!initResult.success && initResult.details && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error Details:</strong> {initResult.details}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Click "Initialize Database" to set up the database</li>
            <li>Copy the owner account credentials</li>
            <li>Go to the login page and sign in as owner</li>
            <li>Start using the recipe site!</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
