"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Database, CheckCircle, XCircle, User, AlertTriangle } from "lucide-react"

interface InitResult {
  success: boolean
  message: string
  owner?: {
    username: string
    email: string
    role: string
  }
  credentials?: {
    email: string
    password: string
  }
  error?: string
}

export default function DatabaseSetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InitResult | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    message: string
  } | null>(null)

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/database/init")
      const data = await response.json()

      setConnectionStatus({
        connected: data.connected,
        message: data.message,
      })
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: "Failed to check connection",
      })
    }
  }

  const initializeDatabase = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/database/init", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        // Also update connection status
        setConnectionStatus({
          connected: true,
          message: "Database connected and initialized",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to initialize database",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Database Setup</h1>
        <p className="text-muted-foreground">Initialize your database and create the owner account</p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connection
          </CardTitle>
          <CardDescription>Check your database connection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button onClick={checkConnection} variant="outline">
              Check Connection
            </Button>

            {connectionStatus && (
              <div className="flex items-center gap-2">
                {connectionStatus.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <Badge variant={connectionStatus.connected ? "default" : "destructive"}>
                  {connectionStatus.message}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to set up your recipe sharing platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Environment Variables</h4>
                <p className="text-sm text-muted-foreground">
                  Ensure your DATABASE_URL is properly configured in your environment
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Initialize Database</h4>
                <p className="text-sm text-muted-foreground">
                  Click the button below to create tables and the owner account
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Login as Owner</h4>
                <p className="text-sm text-muted-foreground">
                  Use the generated credentials to log in and start managing your platform
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Initialize Button */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Initialize Database
          </CardTitle>
          <CardDescription>This will create all necessary tables and the owner account</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will drop existing tables and recreate them. Only run this on a fresh
              database or if you want to reset everything.
            </AlertDescription>
          </Alert>

          <Button onClick={initializeDatabase} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing Database...
              </>
            ) : (
              "Initialize Database & Create Owner Account"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Setup Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={result.success ? "border-green-200" : "border-red-200"}>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            {result.success && result.owner && result.credentials && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Owner Account Created
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Username:</span> {result.owner.username}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {result.owner.email}
                      </div>
                      <div>
                        <span className="font-medium">Role:</span>
                        <Badge className="ml-2">{result.owner.role}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Login Credentials</h4>
                    <div className="space-y-1 text-sm font-mono">
                      <div>Email: {result.credentials.email}</div>
                      <div>Password: {result.credentials.password}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Save these credentials securely. You'll need them to log in as the owner.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild>
                      <a href="/login">Go to Login</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/debug-auth">Debug Auth System</a>
                    </Button>
                  </div>
                </div>
              </>
            )}

            {result.error && (
              <>
                <Separator className="my-4" />
                <div className="text-sm text-red-600">
                  <strong>Error Details:</strong> {result.error}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
