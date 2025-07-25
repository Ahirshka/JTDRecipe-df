"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, User, Database, Shield, Users } from "lucide-react"

interface DebugData {
  timestamp: string
  database: {
    connected: boolean
    error: string | null
  }
  owner: {
    exists: boolean
    details: any
    passwordTest: boolean
  }
  session: {
    valid: boolean
    user: any
    error: string | null
  }
  users: {
    total: number
    list: any[]
  }
  environment: {
    DATABASE_URL: boolean
    NODE_ENV: string
  }
}

export default function DebugAuthPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingOwner, setCreatingOwner] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/auth")
      const data = await response.json()

      if (data.success) {
        setDebugData(data.debug)
      } else {
        setError(data.error || "Debug failed")
        setDebugData(data.debug || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const createOwnerAccount = async () => {
    setCreatingOwner(true)

    try {
      const response = await fetch("/api/debug/auth", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        alert(
          `Owner account created successfully!\n\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}`,
        )
        runDebug() // Refresh debug data
      } else {
        alert(`Failed to create owner account: ${data.error}`)
      }
    } catch (err) {
      alert(`Error creating owner account: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setCreatingOwner(false)
    }
  }

  useEffect(() => {
    runDebug()
  }, [])

  const StatusIcon = ({ status }: { status: boolean }) =>
    status ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Authentication Debug Panel</h1>
        <p className="text-muted-foreground">Comprehensive debugging information for the authentication system</p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={runDebug} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Debug...
            </>
          ) : (
            "Run Debug Check"
          )}
        </Button>

        <Button onClick={createOwnerAccount} disabled={creatingOwner} variant="outline">
          {creatingOwner ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Owner...
            </>
          ) : (
            "Create Owner Account"
          )}
        </Button>
      </div>

      {error && (
        <Alert className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {debugData && (
        <div className="space-y-6">
          {/* Environment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Environment Status
              </CardTitle>
              <CardDescription>Environment configuration and variables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>DATABASE_URL</span>
                  <StatusIcon status={debugData.environment.DATABASE_URL} />
                </div>
                <div className="flex items-center justify-between">
                  <span>NODE_ENV</span>
                  <Badge variant="outline">{debugData.environment.NODE_ENV}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Status
              </CardTitle>
              <CardDescription>Database connection and health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Connection Status</span>
                <div className="flex items-center gap-2">
                  <StatusIcon status={debugData.database.connected} />
                  <Badge variant={debugData.database.connected ? "default" : "destructive"}>
                    {debugData.database.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
              {debugData.database.error && (
                <div className="mt-2 text-sm text-red-600">Error: {debugData.database.error}</div>
              )}
            </CardContent>
          </Card>

          {/* Owner Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Owner Account Status
              </CardTitle>
              <CardDescription>Owner account configuration and authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Account Exists</span>
                  <StatusIcon status={debugData.owner.exists} />
                </div>

                {debugData.owner.exists && debugData.owner.details && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Username:</span> {debugData.owner.details.username}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {debugData.owner.details.email}
                      </div>
                      <div>
                        <span className="font-medium">Role:</span>
                        <Badge className="ml-2">{debugData.owner.details.role}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <Badge variant="outline" className="ml-2">
                          {debugData.owner.details.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Verified:</span>
                        <StatusIcon status={debugData.owner.details.is_verified} />
                      </div>
                      <div>
                        <span className="font-medium">Password Valid:</span>
                        <StatusIcon status={debugData.owner.passwordTest} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Session */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Session
              </CardTitle>
              <CardDescription>Current user session information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Session Valid</span>
                  <StatusIcon status={debugData.session.valid} />
                </div>

                {debugData.session.valid && debugData.session.user ? (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Username:</span> {debugData.session.user.username}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {debugData.session.user.email}
                      </div>
                      <div>
                        <span className="font-medium">Role:</span>
                        <Badge className="ml-2">{debugData.session.user.role}</Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  debugData.session.error && (
                    <div className="text-sm text-red-600">Error: {debugData.session.error}</div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Users Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users Overview
              </CardTitle>
              <CardDescription>All registered users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Total Users</span>
                  <Badge variant="outline">{debugData.users.total}</Badge>
                </div>

                {debugData.users.list.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      {debugData.users.list.map((user, index) => (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.username}</span>
                            <span className="text-sm text-muted-foreground">({user.email})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge size="sm">{user.role}</Badge>
                            <Badge variant="outline" size="sm">
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Debug Timestamp */}
          <div className="text-center text-sm text-muted-foreground">
            Debug run at: {new Date(debugData.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}
