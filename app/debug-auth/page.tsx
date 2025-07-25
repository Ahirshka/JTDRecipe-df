"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, User, Database, Key } from "lucide-react"

interface AuthDebugData {
  databaseConnected: boolean
  tablesExist: string[]
  userCount: number
  ownerAccount: {
    exists: boolean
    details?: {
      id: number
      username: string
      email: string
      role: string
      status: string
      is_verified: boolean
    }
  }
  sessionCount: number
  testResults: {
    passwordHash: boolean
    loginFlow: boolean
  }
}

export default function DebugAuthPage() {
  const [debugData, setDebugData] = useState<AuthDebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [testingLogin, setTestingLogin] = useState(false)
  const [loginResult, setLoginResult] = useState<any>(null)

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/debug/auth")
      const data = await response.json()

      if (data.success) {
        setDebugData(data.debug)
      } else {
        setError(data.error || "Failed to fetch debug data")
      }
    } catch (error) {
      console.error("Debug fetch error:", error)
      setError("Network error while fetching debug data")
    } finally {
      setLoading(false)
    }
  }

  const testOwnerLogin = async () => {
    setTestingLogin(true)
    setLoginResult(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "aaronhirshka@gmail.com",
          password: "Morton2121",
        }),
      })

      const data = await response.json()
      setLoginResult(data)
    } catch (error) {
      console.error("Login test error:", error)
      setLoginResult({
        success: false,
        error: "Network error during login test",
      })
    } finally {
      setTestingLogin(false)
    }
  }

  const StatusBadge = ({ condition }: { condition: boolean }) => (
    <Badge variant={condition ? "default" : "destructive"}>{condition ? "OK" : "FAIL"}</Badge>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Authentication Debug</h1>
          <p className="mt-2 text-gray-600">Debug and test your authentication system</p>
        </div>

        {/* Debug Data Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
            <CardDescription>Current status of your authentication system components</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading debug data...</span>
              </div>
            ) : debugData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database Connection</span>
                      <StatusBadge condition={debugData.databaseConnected} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tables Exist</span>
                      <StatusBadge condition={debugData.tablesExist.length >= 3} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Owner Account</span>
                      <StatusBadge condition={debugData.ownerAccount.exists} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Users</span>
                      <Badge variant="outline">{debugData.userCount}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Sessions</span>
                      <Badge variant="outline">{debugData.sessionCount}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Password Hashing</span>
                      <StatusBadge condition={debugData.testResults.passwordHash} />
                    </div>
                  </div>
                </div>

                {debugData.ownerAccount.exists && debugData.ownerAccount.details && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Owner Account Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>ID: {debugData.ownerAccount.details.id}</div>
                      <div>Username: {debugData.ownerAccount.details.username}</div>
                      <div>Email: {debugData.ownerAccount.details.email}</div>
                      <div>Role: {debugData.ownerAccount.details.role}</div>
                      <div>Status: {debugData.ownerAccount.details.status}</div>
                      <div>Verified: {debugData.ownerAccount.details.is_verified ? "Yes" : "No"}</div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Database Tables</h4>
                  <div className="flex flex-wrap gap-2">
                    {debugData.tablesExist.map((table) => (
                      <Badge key={table} variant="outline">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>Failed to load debug data</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Login Test Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Login Test</span>
            </CardTitle>
            <CardDescription>Test the owner account login functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Test Credentials</h4>
              <div className="text-sm space-y-1">
                <div>Email: aaronhirshka@gmail.com</div>
                <div>Password: Morton2121</div>
                <div>Expected Role: owner</div>
              </div>
            </div>

            <Button onClick={testOwnerLogin} disabled={testingLogin} className="w-full">
              {testingLogin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Login...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Test Owner Login
                </>
              )}
            </Button>

            {loginResult && (
              <Alert variant={loginResult.success ? "default" : "destructive"}>
                {loginResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>
                  {loginResult.success ? (
                    <div>
                      <div className="font-medium">Login Successful!</div>
                      <div className="text-sm mt-1">
                        User: {loginResult.user?.username} ({loginResult.user?.role})
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Login Failed</div>
                      <div className="text-sm mt-1">{loginResult.error}</div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common debugging and management actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" onClick={fetchDebugData} disabled={loading}>
                Refresh Debug Data
              </Button>

              <Button variant="outline" onClick={() => window.open("/database-setup", "_blank")}>
                Database Setup
              </Button>

              <Button variant="outline" onClick={() => window.open("/login", "_blank")}>
                Test Login Page
              </Button>

              <Button variant="outline" onClick={() => window.open("/admin", "_blank")}>
                Admin Panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
