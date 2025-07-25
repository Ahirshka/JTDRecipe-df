"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Database, CheckCircle, XCircle, AlertTriangle, Loader2, Crown, Shield, RefreshCw, Trash2 } from "lucide-react"

interface DatabaseStatus {
  connected: boolean
  tablesExist: boolean
  ownerExists: boolean
  error?: string
}

export default function DatabaseSetupPage() {
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    tablesExist: false,
    ownerExists: false,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [ownerData, setOwnerData] = useState({
    username: "aaronhirshka",
    email: "aaronhirshka@gmail.com",
    password: "Morton2121",
    role: "owner",
  })

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/database/init", {
        method: "GET",
      })
      const data = await response.json()

      setStatus({
        connected: data.connected || false,
        tablesExist: data.tablesExist || false,
        ownerExists: data.ownerExists || false,
        error: data.error,
      })
    } catch (error) {
      console.error("Error checking database status:", error)
      setStatus({
        connected: false,
        tablesExist: false,
        ownerExists: false,
        error: "Failed to check database status",
      })
    }
  }

  const initializeDatabase = async () => {
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/database/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "initialize",
          ownerData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("✅ Database initialized successfully!")
        await checkDatabaseStatus()
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Database initialization error:", error)
      setMessage("❌ Network error during initialization")
    } finally {
      setLoading(false)
    }
  }

  const resetDatabase = async () => {
    if (!confirm("Are you sure you want to reset the database? This will delete all data!")) {
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/database/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reset",
          ownerData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("✅ Database reset successfully!")
        await checkDatabaseStatus()
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Database reset error:", error)
      setMessage("❌ Network error during reset")
    } finally {
      setLoading(false)
    }
  }

  const createOwnerAccount = async () => {
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/database/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "createOwner",
          ownerData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("✅ Owner account created successfully!")
        await checkDatabaseStatus()
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Owner creation error:", error)
      setMessage("❌ Network error during owner creation")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />
  }

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={condition ? "default" : "destructive"} className="ml-2">
        {condition ? trueText : falseText}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Database className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">Database Setup</h1>
          </div>
          <p className="text-gray-600">Initialize your recipe sharing platform database</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Database Status
            </CardTitle>
            <CardDescription>Current state of your database and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon(status.connected)}
                <span className="ml-2 font-medium">Database Connection</span>
              </div>
              {getStatusBadge(status.connected, "Connected", "Disconnected")}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon(status.tablesExist)}
                <span className="ml-2 font-medium">Database Tables</span>
              </div>
              {getStatusBadge(status.tablesExist, "Created", "Missing")}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon(status.ownerExists)}
                <span className="ml-2 font-medium">Owner Account</span>
              </div>
              {getStatusBadge(status.ownerExists, "Exists", "Missing")}
            </div>

            {status.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{status.error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={checkDatabaseStatus} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Owner Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-600" />
              Owner Account Configuration
            </CardTitle>
            <CardDescription>Configure the main administrator account for your platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={ownerData.username}
                  onChange={(e) => setOwnerData({ ...ownerData, username: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={ownerData.email}
                  onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={ownerData.password}
                onChange={(e) => setOwnerData({ ...ownerData, password: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={ownerData.role} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500 mt-1">Owner role provides full administrative access</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Database Actions</CardTitle>
            <CardDescription>Initialize, reset, or configure your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={initializeDatabase} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                Initialize Database
              </Button>

              <Button
                onClick={createOwnerAccount}
                disabled={loading || !status.tablesExist}
                variant="outline"
                className="w-full bg-transparent"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crown className="w-4 h-4 mr-2" />}
                Create Owner Account
              </Button>

              <Button onClick={resetDatabase} disabled={loading} variant="destructive" className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Reset Database
              </Button>
            </div>

            <Separator />

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Initialize Database:</strong> Creates all necessary tables and the owner account
              </p>
              <p>
                <strong>Create Owner Account:</strong> Creates only the owner account (requires existing tables)
              </p>
              <p>
                <strong>Reset Database:</strong> Deletes all data and recreates tables with the owner account
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Message Display */}
        {message && (
          <Alert className={message.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertDescription className="font-medium">{message}</AlertDescription>
          </Alert>
        )}

        {/* Quick Access */}
        {status.ownerExists && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-green-700">✅ Setup Complete!</CardTitle>
              <CardDescription>Your database is ready. You can now access your platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={() => (window.location.href = "/login")}>Go to Login</Button>
                <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
                  Admin Panel
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/")}>
                  Home Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
