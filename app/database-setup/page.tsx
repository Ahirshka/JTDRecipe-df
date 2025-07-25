"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, RefreshCw, Database, Lock, User } from "lucide-react"

export default function DatabaseSetup() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [rawResponse, setRawResponse] = useState<string>("")

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setResult(null)
    setError(null)
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

      try {
        const data = JSON.parse(responseText)

        if (data.success) {
          console.log("✅ [DB-SETUP] Database initialized successfully:", data)
          setResult(data)
        } else {
          console.error("❌ [DB-SETUP] Database initialization failed:", data.error)
          setError(data.error || "Unknown error")
        }
      } catch (parseError) {
        console.error("❌ [DB-SETUP] Failed to parse response:", parseError)
        setError(`Failed to parse response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`)
      }
    } catch (fetchError) {
      console.error("❌ [DB-SETUP] Fetch error:", fetchError)
      setError(`Network error: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`)
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Database className="w-8 h-8 text-blue-600" />
        Database Setup
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Initialize Database</CardTitle>
          <CardDescription>Set up the database tables and create an owner account</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This will create the following tables:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Users (with authentication)</li>
            <li>Sessions (for login management)</li>
            <li>Recipes (with JSONB arrays for ingredients and instructions)</li>
          </ul>
          <p className="mb-4">It will also create an owner account with admin privileges:</p>
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-700" />
              <span className="font-medium">Username:</span>
              <code className="bg-gray-200 px-2 py-1 rounded">admin</code>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Email:</span>
              <code className="bg-gray-200 px-2 py-1 rounded">admin@recipesite.com</code>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-700" />
              <span className="font-medium">Password:</span>
              <code className="bg-gray-200 px-2 py-1 rounded">admin123</code>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={initializeDatabase} disabled={isInitializing} className="w-full">
            {isInitializing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Initialize Database
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Alert variant="default" className="mb-6 border-green-500 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            Database initialized successfully.
            {result.owner?.success && (
              <div className="mt-2">
                <p className="font-medium">Owner account:</p>
                <ul className="list-disc pl-6 mt-1">
                  <li>Username: {result.owner.user?.username || "admin"}</li>
                  <li>Email: {result.owner.user?.email || "admin@recipesite.com"}</li>
                  <li>Role: {result.owner.user?.role || "admin"}</li>
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(result || error) && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-64 text-xs">
              {rawResponse || "No response data"}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
