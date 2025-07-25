"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Database, User, Shield } from "lucide-react"

interface DatabaseStatus {
  connected: boolean
  tablesExist: boolean
  ownerExists: boolean
}

export default function DatabaseSetupPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Owner form data
  const [ownerData, setOwnerData] = useState({
    username: "aaronhirshka",
    email: "aaronhirshka@gmail.com",
    password: "Morton2121",
    role: "owner",
  })

  // Check database status on component mount
  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setChecking(true)
    setError("")

    try {
      const response = await fetch("/api/database/init")
      const data = await response.json()

      if (data.success) {
        setStatus({
          connected: data.connected,
          tablesExist: data.tablesExist,
          ownerExists: data.ownerExists,
        })
      } else {
        setError(data.error || "Failed to check database status")
      }
    } catch (error) {
      console.error("Status check error:", error)
      setError("Network error while checking database status")
    } finally {
      setChecking(false)
    }
  }

  const handleAction = async (action: "initialize" | "reset" | "createOwner") => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/database/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          ownerData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(data.message)
        // Refresh status after successful action
        setTimeout(() => {
          checkDatabaseStatus()
        }, 1000)
      } else {
        setError(data.error || `Failed to ${action} database`)
      }
    } catch (error) {
      console.error(`${action} error:`, error)
      setError(`Network error during ${action}`)
    } finally {
      setLoading(false)
    }
  }

  const StatusIndicator = ({ condition, label }: { condition: boolean; label: string }) => (
    <div className="flex items-center space-x-2">
      {condition ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
      <span className="text-sm">{label}</span>
      <Badge variant={condition ? "default" : "destructive"}>{condition ? "Ready" : "Missing"}</Badge>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Database Setup</h1>
          <p className="mt-2 text-gray-600">Initialize your recipe sharing platform database</p>
        </div>

        {/* Database Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Status</span>
            </CardTitle>
            <CardDescription>Current status of your database connection and setup</CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking database status...</span>
              </div>
            ) : status ? (
              <div className="space-y-3">
                <StatusIndicator condition={status.connected} label="Database Connection" />
                <StatusIndicator condition={status.tablesExist} label="Database Tables" />
                <StatusIndicator condition={status.ownerExists} label="Owner Account" />

                <Button variant="outline" size="sm" onClick={checkDatabaseStatus} disabled={checking}>
                  Refresh Status
                </Button>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>Failed to check database status</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Owner Account Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Owner Account Configuration</span>
            </CardTitle>
            <CardDescription>Configure the main administrator account for your platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={ownerData.username}
                  onChange={(e) => setOwnerData({ ...ownerData, username: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={ownerData.email}
                  onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={ownerData.password}
                  onChange={(e) => setOwnerData({ ...ownerData, password: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={ownerData.role}
                  onChange={(e) => setOwnerData({ ...ownerData, role: e.target.value })}
                  disabled={loading}
                  readOnly
                />
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                The owner account will have full administrative privileges including user management, content
                moderation, and system configuration access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Database Actions</CardTitle>
            <CardDescription>Choose an action to set up or manage your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleAction("initialize")}
                disabled={loading || checking}
                className="h-auto py-4 flex flex-col items-center space-y-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
                <div className="text-center">
                  <div className="font-medium">Initialize Database</div>
                  <div className="text-xs opacity-75">Create tables and owner account</div>
                </div>
              </Button>

              <Button
                variant="destructive"
                onClick={() => handleAction("reset")}
                disabled={loading || checking}
                className="h-auto py-4 flex flex-col items-center space-y-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
                <div className="text-center">
                  <div className="font-medium">Reset Database</div>
                  <div className="text-xs opacity-75">Drop all tables and recreate</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleAction("createOwner")}
                disabled={loading || checking}
                className="h-auto py-4 flex flex-col items-center space-y-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <User className="h-5 w-5" />}
                <div className="text-center">
                  <div className="font-medium">Create Owner Only</div>
                  <div className="text-xs opacity-75">Create/recreate owner account</div>
                </div>
              </Button>
            </div>

            {message && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>After setting up your database, here's what you can do next</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                1. <strong>Test Login:</strong> Visit{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  /login
                </a>{" "}
                to test your owner account
              </p>
              <p className="text-sm">
                2. <strong>Admin Panel:</strong> Access{" "}
                <a href="/admin" className="text-blue-600 hover:underline">
                  /admin
                </a>{" "}
                for platform management
              </p>
              <p className="text-sm">
                3. <strong>Debug Tools:</strong> Use{" "}
                <a href="/debug-auth" className="text-blue-600 hover:underline">
                  /debug-auth
                </a>{" "}
                to troubleshoot authentication
              </p>
              <p className="text-sm">
                4. <strong>Main Site:</strong> Visit{" "}
                <a href="/" className="text-blue-600 hover:underline">
                  /
                </a>{" "}
                to see your recipe sharing platform
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
