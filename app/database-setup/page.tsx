"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, User, CheckCircle, AlertCircle } from "lucide-react"

export default function DatabaseSetupPage() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/init-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Failed to initialize database")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Database initialization error:", err)
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <Database className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Setup</h1>
          <p className="text-gray-600">Initialize your recipe site database and create the owner account</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Initialization
            </CardTitle>
            <CardDescription>
              This will create all necessary database tables and set up the owner account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={initializeDatabase} disabled={isInitializing} className="w-full" size="lg">
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Database
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Database Initialized Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Account Credentials
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Email:</span>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{result.credentials?.email}</code>
                  </div>
                  <div>
                    <span className="font-medium">Password:</span>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{result.credentials?.password}</code>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Save these credentials! You can now log in with the owner account to
                  access admin features and moderate recipes.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <a href="/login">Go to Login</a>
                </Button>
                <Button variant="outline" asChild className="flex-1 bg-transparent">
                  <a href="/">Go to Home</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Check the server logs for detailed information.</p>
        </div>
      </div>
    </div>
  )
}
